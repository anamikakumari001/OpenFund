#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, Symbol,
};

// ─── Storage keys ───────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    MilestoneInfo(Symbol),         // -> MilestoneInfo
    DonorAmount(Symbol, Address),  // -> i128
}

// ─── Data structures ─────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneInfo {
    pub admin: Address,     // project owner — who can release/cancel
    pub treasury: Address,  // where funds go on release
    pub token: Address,     // USDC SAC address
    pub balance: i128,      // total escrowed
    pub released: bool,
    pub cancelled: bool,
}

// ─── Event topic symbols (compile-time, ≤9 chars each) ───────────────────────

const EVENT_INIT: &str    = "init";
const EVENT_FUND: &str    = "fund";
const EVENT_RELEASE: &str = "release";
const EVENT_CANCEL: &str  = "cancel";
const EVENT_REFUND: &str  = "refund";

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct MilestoneEscrow;

#[contractimpl]
impl MilestoneEscrow {
    /// Create an escrow slot for a milestone.
    /// Only the admin (project owner) can call this.
    pub fn init_milestone(
        env: Env,
        milestone_id: Symbol,
        admin: Address,
        treasury: Address,
        token: Address,
    ) {
        admin.require_auth();
        let key = DataKey::MilestoneInfo(milestone_id.clone());
        if env.storage().persistent().has(&key) {
            panic!("milestone already initialized");
        }
        let info = MilestoneInfo {
            admin: admin.clone(),
            treasury: treasury.clone(),
            token,
            balance: 0,
            released: false,
            cancelled: false,
        };
        env.storage().persistent().set(&key, &info);

        // EVENT: milestone_initialized(milestone_id, admin, treasury)
        env.events().publish(
            (Symbol::new(&env, EVENT_INIT), milestone_id),
            (admin, treasury),
        );
    }

    /// Donor locks funds into the escrow for a milestone.
    /// The donor signs this transaction; the contract transfers tokens from
    /// donor -> contract using the SAC token interface.
    pub fn fund(env: Env, milestone_id: Symbol, donor: Address, amount: i128) {
        donor.require_auth();
        assert!(amount > 0, "amount must be positive");

        let key = DataKey::MilestoneInfo(milestone_id.clone());
        let mut info: MilestoneInfo = env
            .storage()
            .persistent()
            .get(&key)
            .expect("milestone not found");
        assert!(!info.released, "milestone already released");
        assert!(!info.cancelled, "milestone cancelled");

        // Transfer tokens from donor to this contract
        let token_client = token::Client::new(&env, &info.token);
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // Update balance
        info.balance += amount;
        env.storage().persistent().set(&key, &info);

        // Track donor's share for refunds
        let donor_key = DataKey::DonorAmount(milestone_id.clone(), donor.clone());
        let prev: i128 = env
            .storage()
            .persistent()
            .get(&donor_key)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&donor_key, &(prev + amount));

        // EVENT: milestone_funded(milestone_id, donor, amount, new_balance)
        env.events().publish(
            (Symbol::new(&env, EVENT_FUND), milestone_id),
            (donor, amount, info.balance),
        );
    }

    /// Project owner releases escrowed funds to the treasury.
    pub fn release(env: Env, milestone_id: Symbol) {
        let key = DataKey::MilestoneInfo(milestone_id.clone());
        let mut info: MilestoneInfo = env
            .storage()
            .persistent()
            .get(&key)
            .expect("milestone not found");

        info.admin.require_auth();
        assert!(!info.released, "already released");
        assert!(!info.cancelled, "milestone cancelled");
        assert!(info.balance > 0, "no funds to release");

        let released_amount = info.balance;

        // Transfer all funds to treasury
        let token_client = token::Client::new(&env, &info.token);
        token_client.transfer(
            &env.current_contract_address(),
            &info.treasury,
            &info.balance,
        );

        info.balance = 0;
        info.released = true;
        env.storage().persistent().set(&key, &info);

        // EVENT: milestone_released(milestone_id, treasury, amount)
        env.events().publish(
            (Symbol::new(&env, EVENT_RELEASE), milestone_id),
            (info.treasury, released_amount),
        );
    }

    /// Project owner cancels the escrow, enabling refunds.
    pub fn cancel(env: Env, milestone_id: Symbol) {
        let key = DataKey::MilestoneInfo(milestone_id.clone());
        let mut info: MilestoneInfo = env
            .storage()
            .persistent()
            .get(&key)
            .expect("milestone not found");

        info.admin.require_auth();
        assert!(!info.released, "already released");
        assert!(!info.cancelled, "already cancelled");

        info.cancelled = true;
        env.storage().persistent().set(&key, &info);

        // EVENT: milestone_cancelled(milestone_id, admin)
        env.events().publish(
            (Symbol::new(&env, EVENT_CANCEL), milestone_id),
            (info.admin,),
        );
    }

    /// Donor claims a refund after the milestone is cancelled.
    pub fn refund(env: Env, milestone_id: Symbol, donor: Address) {
        donor.require_auth();

        let key = DataKey::MilestoneInfo(milestone_id.clone());
        let mut info: MilestoneInfo = env
            .storage()
            .persistent()
            .get(&key)
            .expect("milestone not found");
        assert!(info.cancelled, "milestone not cancelled");
        assert!(!info.released, "already released");

        let donor_key = DataKey::DonorAmount(milestone_id.clone(), donor.clone());
        let amount: i128 = env
            .storage()
            .persistent()
            .get(&donor_key)
            .unwrap_or(0);
        assert!(amount > 0, "no funds to refund");

        // Zero out donor's balance before transfer (re-entrancy guard)
        env.storage().persistent().set(&donor_key, &(0i128));
        info.balance -= amount;
        env.storage().persistent().set(&key, &info);

        let token_client = token::Client::new(&env, &info.token);
        token_client.transfer(&env.current_contract_address(), &donor, &amount);

        // EVENT: donor_refunded(milestone_id, donor, amount)
        env.events().publish(
            (Symbol::new(&env, EVENT_REFUND), milestone_id),
            (donor, amount),
        );
    }

    // ─── Read-only ───────────────────────────────────────────────────────

    pub fn get_info(env: Env, milestone_id: Symbol) -> Option<MilestoneInfo> {
        env.storage()
            .persistent()
            .get(&DataKey::MilestoneInfo(milestone_id))
    }

    pub fn get_balance(env: Env, milestone_id: Symbol) -> i128 {
        let info: Option<MilestoneInfo> = env
            .storage()
            .persistent()
            .get(&DataKey::MilestoneInfo(milestone_id));
        info.map(|i| i.balance).unwrap_or(0)
    }

    pub fn get_donor_amount(env: Env, milestone_id: Symbol, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorAmount(milestone_id, donor))
            .unwrap_or(0)
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        Env,
    };
    use soroban_sdk::token::StellarAssetClient;

    /// Helper: create a minimal test environment with auth mocked.
    fn create_env() -> Env {
        let env = Env::default();
        env.mock_all_auths();
        env
    }

    /// Helper: deploy a Stellar Asset Contract (mock USDC) and mint tokens to recipient.
    fn setup_token(env: &Env, recipient: &Address, amount: i128) -> Address {
        let token_admin = Address::generate(env);
        let token_id = env.register_stellar_asset_contract(token_admin.clone());
        let sac = StellarAssetClient::new(env, &token_id);
        sac.mint(recipient, &amount);
        token_id
    }

    /// Helper: register the escrow contract and return (contract_id, client).
    fn deploy_escrow(env: &Env) -> (Address, MilestoneEscrowClient) {
        let contract_id = env.register_contract(None, MilestoneEscrow);
        let client = MilestoneEscrowClient::new(env, &contract_id);
        (contract_id, client)
    }

    // ── Test 1 ──────────────────────────────────────────────────────────────

    #[test]
    fn test_init_milestone_creates_correct_state() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 1_000_000_000);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_init");
        client.init_milestone(&ms, &admin, &treasury, &token);

        let info = client.get_info(&ms).unwrap();
        assert_eq!(info.admin, admin);
        assert_eq!(info.treasury, treasury);
        assert_eq!(info.token, token);
        assert_eq!(info.balance, 0);
        assert!(!info.released);
        assert!(!info.cancelled);

        assert_eq!(client.get_balance(&ms), 0);
    }

    // ── Test 2 ──────────────────────────────────────────────────────────────

    #[test]
    fn test_fund_increases_balance_and_tracks_donor() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 1_000_000_000);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_fund");
        client.init_milestone(&ms, &admin, &treasury, &token);

        let amount: i128 = 500_000_000; // 50 USDC (7 decimals)
        client.fund(&ms, &donor, &amount);

        assert_eq!(client.get_balance(&ms), amount);
        assert_eq!(client.get_donor_amount(&ms, &donor), amount);

        let info = client.get_info(&ms).unwrap();
        assert_eq!(info.balance, amount);
        assert!(!info.released);
        assert!(!info.cancelled);
    }

    // ── Test 3 ──────────────────────────────────────────────────────────────

    #[test]
    fn test_multiple_donors_accumulate_balance() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor_a = Address::generate(&env);
        let donor_b = Address::generate(&env);

        // Mint tokens to both donors
        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin.clone());
        let sac = StellarAssetClient::new(&env, &token_id);
        sac.mint(&donor_a, &300_000_000i128);
        sac.mint(&donor_b, &200_000_000i128);

        let (_, client) = deploy_escrow(&env);
        let ms = Symbol::new(&env, "ms_multi");
        client.init_milestone(&ms, &admin, &treasury, &token_id);

        client.fund(&ms, &donor_a, &300_000_000);
        client.fund(&ms, &donor_b, &200_000_000);

        assert_eq!(client.get_balance(&ms), 500_000_000);
        assert_eq!(client.get_donor_amount(&ms, &donor_a), 300_000_000);
        assert_eq!(client.get_donor_amount(&ms, &donor_b), 200_000_000);
    }

    // ── Test 4 ──────────────────────────────────────────────────────────────

    #[test]
    fn test_release_sends_funds_to_treasury() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 1_000_000_000);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_rel");
        client.init_milestone(&ms, &admin, &treasury, &token);
        client.fund(&ms, &donor, &500_000_000);
        client.release(&ms);

        let info = client.get_info(&ms).unwrap();
        assert_eq!(info.balance, 0);
        assert!(info.released);
        assert!(!info.cancelled);

        assert_eq!(client.get_balance(&ms), 0);
    }

    // ── Test 5 ──────────────────────────────────────────────────────────────

    #[test]
    fn test_cancel_then_refund() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 1_000_000_000);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_canc");
        client.init_milestone(&ms, &admin, &treasury, &token);
        client.fund(&ms, &donor, &400_000_000);
        client.cancel(&ms);

        let info = client.get_info(&ms).unwrap();
        assert!(info.cancelled);
        assert!(!info.released);

        // Refund should succeed
        client.refund(&ms, &donor);

        let info_after = client.get_info(&ms).unwrap();
        assert_eq!(info_after.balance, 0);
        assert_eq!(client.get_donor_amount(&ms, &donor), 0);
    }

    // ── Test 6 ──────────────────────────────────────────────────────────────

    #[test]
    #[should_panic(expected = "milestone already initialized")]
    fn test_double_init_panics() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 0);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_dbl");
        client.init_milestone(&ms, &admin, &treasury, &token);
        client.init_milestone(&ms, &admin, &treasury, &token); // should panic
    }

    // ── Test 7 ──────────────────────────────────────────────────────────────

    #[test]
    #[should_panic(expected = "no funds to release")]
    fn test_release_with_zero_balance_panics() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 0);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_zero");
        client.init_milestone(&ms, &admin, &treasury, &token);
        client.release(&ms); // should panic — nothing to release
    }

    // ── Test 8 ──────────────────────────────────────────────────────────────

    #[test]
    #[should_panic(expected = "milestone not cancelled")]
    fn test_refund_before_cancel_panics() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 1_000_000_000);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_nocnc");
        client.init_milestone(&ms, &admin, &treasury, &token);
        client.fund(&ms, &donor, &100_000_000);
        client.refund(&ms, &donor); // should panic — not cancelled yet
    }

    // ── Test 9 ──────────────────────────────────────────────────────────────

    #[test]
    #[should_panic(expected = "milestone already released")]
    fn test_fund_after_release_panics() {
        let env = create_env();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let donor = Address::generate(&env);
        let token = setup_token(&env, &donor, 1_000_000_000);
        let (_, client) = deploy_escrow(&env);

        let ms = Symbol::new(&env, "ms_prel");
        client.init_milestone(&ms, &admin, &treasury, &token);
        client.fund(&ms, &donor, &100_000_000);
        client.release(&ms);
        client.fund(&ms, &donor, &50_000_000); // should panic
    }

    // ── Test 10 ─────────────────────────────────────────────────────────────

    #[test]
    fn test_get_info_returns_none_for_unknown_milestone() {
        let env = create_env();
        let (_, client) = deploy_escrow(&env);
        let ms = Symbol::new(&env, "ms_miss");
        assert!(client.get_info(&ms).is_none());
        assert_eq!(client.get_balance(&ms), 0);
    }
}
