import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import * as StellarSdk from "@stellar/stellar-sdk";
import { prisma } from "./prisma";
import { server, USDC_ASSET, NETWORK_PASSPHRASE } from "./stellar";

async function createAndFundStellarWallet(): Promise<{ publicKey: string; secretKey: string } | null> {
  try {
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    if (process.env.STELLAR_NETWORK !== "mainnet") {
      // Await Friendbot — account must exist before we can add trust line
      const fbRes = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      ).catch(() => null);

      if (fbRes?.ok) {
        // Add Circle testnet USDC trust line immediately after account is created
        try {
          const account = await server.loadAccount(publicKey);
          const trustTx = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(StellarSdk.Operation.changeTrust({ asset: USDC_ASSET }))
            .setTimeout(30)
            .build();
          trustTx.sign(keypair);
          await server.submitTransaction(trustTx);
        } catch (trustErr) {
          console.error("[wallet] USDC trust line failed:", trustErr);
        }
      }
    }

    return { publicKey, secretKey };
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (!session.user) return session;

      session.user.id = user.id;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          githubUsername: true,
          role: true,
          stellarPublicKey: true,
        },
      });

      if (!dbUser) return session;

      session.user.githubUsername = dbUser.githubUsername ?? undefined;
      session.user.role = dbUser.role;
      session.user.stellarPublicKey = dbUser.stellarPublicKey ?? undefined;

      // Self-healing: if GitHub profile fields are missing, pull from Account table
      if (!dbUser.githubUsername) {
        try {
          const account = await prisma.account.findFirst({
            where: { userId: user.id, provider: "github" },
            select: { access_token: true, providerAccountId: true },
          });

          if (account?.access_token) {
            const ghRes = await fetch("https://api.github.com/user", {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                "User-Agent": "openfund",
              },
            });

            if (ghRes.ok) {
              const gh = await ghRes.json() as {
                login: string;
                id: number;
                bio: string | null;
                blog: string | null;
                location: string | null;
                twitter_username: string | null;
              };

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  githubUsername: gh.login,
                  githubId: String(gh.id),
                  githubAccessToken: account.access_token,
                  bio: gh.bio,
                  website: gh.blog,
                  location: gh.location,
                  twitterUsername: gh.twitter_username,
                },
              });

              session.user.githubUsername = gh.login;
            }
          }
        } catch (err) {
          console.error("[session] Failed to self-heal GitHub profile:", err);
        }
      }

      // Self-healing: auto-create Stellar wallet if missing
      if (!dbUser.stellarPublicKey) {
        try {
          const wallet = await createAndFundStellarWallet();
          if (wallet) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                stellarPublicKey: wallet.publicKey,
                stellarSecretKey: wallet.secretKey,
              },
            });
            session.user.stellarPublicKey = wallet.publicKey;
          }
        } catch (err) {
          console.error("[session] Failed to create Stellar wallet:", err);
        }
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile && user.id) {
        const githubProfile = profile as {
          login?: string;
          id?: number;
          bio?: string;
          blog?: string;
          location?: string;
          twitter_username?: string;
        };

        try {
          const existing = await prisma.user.findUnique({
            where: { id: user.id },
            select: { stellarPublicKey: true },
          });

          const updateData: Record<string, unknown> = {
            githubUsername: githubProfile.login,
            githubId: githubProfile.id?.toString(),
            githubAccessToken: account.access_token,
            bio: githubProfile.bio,
            website: githubProfile.blog,
            location: githubProfile.location,
            twitterUsername: githubProfile.twitter_username,
          };

          if (!existing?.stellarPublicKey) {
            const wallet = await createAndFundStellarWallet();
            if (wallet) {
              updateData.stellarPublicKey = wallet.publicKey;
              updateData.stellarSecretKey = wallet.secretKey;
            }
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } catch (err) {
          console.error("[signIn] Failed to update user profile:", err);
          // Don't block sign-in — session callback will self-heal
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "database",
  },
});
