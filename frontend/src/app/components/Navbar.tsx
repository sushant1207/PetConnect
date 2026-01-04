"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, MenuItem, HoveredLink } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="fixed top-10 inset-x-0 max-w-7xl mx-auto z-50 px-4">
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
  );
}

