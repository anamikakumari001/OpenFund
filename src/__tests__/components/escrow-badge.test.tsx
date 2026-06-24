import React from "react";
import { render, screen } from "@testing-library/react";
import { EscrowBadge } from "@/components/escrow/escrow-badge";

// Mock lucide-react icons to avoid SVG rendering issues in jsdom
jest.mock("lucide-react", () => ({
  Lock: () => <span data-testid="icon-lock" />,
  Unlock: () => <span data-testid="icon-unlock" />,
  XCircle: () => <span data-testid="icon-xcircle" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
}));

describe("EscrowBadge component", () => {
  it("shows 'Released' badge when released=true", () => {
    render(<EscrowBadge released={true} cancelled={false} balance={0} />);
    expect(screen.getByText("Released")).toBeInTheDocument();
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
  });

  it("shows 'Cancelled' badge when cancelled=true and not released", () => {
    render(<EscrowBadge released={false} cancelled={true} balance={0} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByTestId("icon-xcircle")).toBeInTheDocument();
  });

  it("shows locked USDC amount when balance > 0", () => {
    render(<EscrowBadge released={false} cancelled={false} balance={150} />);
    expect(screen.getByText(/150 USDC in escrow/)).toBeInTheDocument();
    expect(screen.getByTestId("icon-lock")).toBeInTheDocument();
  });

  it("shows 'Escrow ready' when no funds and not cancelled/released", () => {
    render(<EscrowBadge released={false} cancelled={false} balance={0} />);
    expect(screen.getByText("Escrow ready")).toBeInTheDocument();
    expect(screen.getByTestId("icon-unlock")).toBeInTheDocument();
  });

  it("prioritizes released over balance display", () => {
    render(<EscrowBadge released={true} cancelled={false} balance={500} />);
    expect(screen.getByText("Released")).toBeInTheDocument();
    expect(screen.queryByText(/USDC in escrow/)).not.toBeInTheDocument();
  });

  it("prioritizes cancelled over escrow-ready display", () => {
    render(<EscrowBadge released={false} cancelled={true} balance={0} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Escrow ready")).not.toBeInTheDocument();
  });

  it("applies custom className prop", () => {
    const { container } = render(
      <EscrowBadge released={false} cancelled={false} balance={0} className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("formats balance to whole number", () => {
    render(<EscrowBadge released={false} cancelled={false} balance={99.7} />);
    expect(screen.getByText(/100 USDC in escrow/)).toBeInTheDocument();
  });
});
