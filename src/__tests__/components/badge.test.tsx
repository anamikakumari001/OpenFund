import React from "react";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge component", () => {
  it("renders children text", () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies default variant classes by default", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-blue-50");
    expect(badge).toHaveClass("text-blue-700");
  });

  it("applies success variant classes", () => {
    const { container } = render(<Badge variant="success">Funded</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-green-50");
    expect(badge).toHaveClass("text-green-700");
  });

  it("applies warning variant classes", () => {
    const { container } = render(<Badge variant="warning">Pre-release</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-amber-50");
    expect(badge).toHaveClass("text-amber-700");
  });

  it("applies danger variant classes", () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-red-50");
    expect(badge).toHaveClass("text-red-700");
  });

  it("applies secondary variant classes", () => {
    const { container } = render(<Badge variant="secondary">Tag</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-600");
  });

  it("merges custom className", () => {
    const { container } = render(<Badge className="rounded-full">Custom</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("rounded-full");
  });

  it("renders as a div element", () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });
});
