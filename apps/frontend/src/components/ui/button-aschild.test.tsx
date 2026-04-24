import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("<Button asChild />", () => {
  it("renders child element as the root", () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: /link/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe("a");
  });

  it("renders all size + variant combinations", () => {
    const variants = ["default", "outline", "ghost", "destructive"] as const;
    const sizes = ["default", "sm", "lg", "icon"] as const;
    variants.forEach((v) => {
      sizes.forEach((s) => {
        const { unmount } = render(
          <Button variant={v} size={s}>
            {v}-{s}
          </Button>,
        );
        expect(screen.getByRole("button", { name: `${v}-${s}` })).toBeInTheDocument();
        unmount();
      });
    });
  });
});
