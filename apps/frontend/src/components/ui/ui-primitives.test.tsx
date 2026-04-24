import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";

describe("<Input />", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
  });
  it("accepts className override", () => {
    render(<Input className="custom-x" placeholder="x" />);
    expect(screen.getByPlaceholderText("x").className).toMatch(/custom-x/);
  });
});

describe("<Textarea />", () => {
  it("renders with placeholder", () => {
    render(<Textarea placeholder="msg" />);
    expect(screen.getByPlaceholderText("msg")).toBeInTheDocument();
  });
});

describe("<Card />", () => {
  it("renders nested parts", () => {
    render(
      <Card>
        <CardHeader>
          <h2>H</h2>
        </CardHeader>
        <CardContent>content</CardContent>
        <CardFooter>footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("footer")).toBeInTheDocument();
  });
});

describe("<Skeleton />", () => {
  it("renders with animate-pulse class", () => {
    const { container } = render(<Skeleton data-testid="sk" />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });
});

describe("<Avatar />", () => {
  it("renders first-letter initial uppercase", () => {
    render(<Avatar name="alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
