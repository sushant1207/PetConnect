"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, MenuItem, HoveredLink } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="fixed top-4 md:top-10 inset-x-0 max-w-7xl mx-auto z-50 px-4">
      <div className="md:hidden">
        <div className="rounded-2xl border border-primary/20 bg-white/90 backdrop-blur-xl shadow-md px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-base text-foreground">PetConnect</Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 text-foreground"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? "X" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-2 rounded-2xl border border-primary/20 bg-white/95 backdrop-blur-xl shadow-lg p-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/5">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/5">How It Works</a>
            <a href="#who-its-for" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/5">Who It&apos;s For</a>
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <Menu setActive={setActive}>
          <MenuItem setActive={setActive} active={active} item="Home" href="/">
          </MenuItem>
          <MenuItem setActive={setActive} active={active} item="Features">
            <div className="flex flex-col space-y-4 text-sm">
              <HoveredLink href="#features">Smart Pet Profiles</HoveredLink>
              <HoveredLink href="#features">Vet Appointment Booking</HoveredLink>
              <HoveredLink href="#features">Lost & Found System</HoveredLink>
              <HoveredLink href="#features">Charity & Donations</HoveredLink>
              <HoveredLink href="#features">QR-Based Pet ID</HoveredLink>
            </div>
          </MenuItem>
          <MenuItem setActive={setActive} active={active} item="How It Works">
            <div className="flex flex-col space-y-4 text-sm">
              <HoveredLink href="#how-it-works">Get Started</HoveredLink>
              <HoveredLink href="#how-it-works">Register Your Pet</HoveredLink>
              <HoveredLink href="#how-it-works">Book Appointments</HoveredLink>
              <HoveredLink href="#how-it-works">Support Welfare</HoveredLink>
            </div>
          </MenuItem>
          <MenuItem setActive={setActive} active={active} item="For">
            <div className="flex flex-col space-y-4 text-sm">
              <HoveredLink href="#who-its-for">Pet Owners</HoveredLink>
              <HoveredLink href="#who-its-for">Veterinarians</HoveredLink>
              <HoveredLink href="#who-its-for">Shelters & NGOs</HoveredLink>
              <HoveredLink href="#who-its-for">Pharmacies</HoveredLink>
            </div>
          </MenuItem>
          <div className="flex items-center space-x-3 ml-4">
            <Link
              href="/login"
              className={cn(
                "relative inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-all duration-200",
                "border border-primary/20 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10",
                "text-foreground hover:text-primary bg-white/50 dark:bg-black/50 backdrop-blur-sm"
              )}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={cn(
                "relative inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground",
                "hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
              )}
            >
              Get Started
            </Link>
          </div>
        </Menu>
      </div>
    </div>
  );
}

