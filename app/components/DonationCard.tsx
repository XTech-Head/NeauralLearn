"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Coffee,
  Sparkles,
  Brain,
  Server,
  Rocket,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/xammyHuncho";

export default function DonationCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-xl"
    >
      <Card className="relative overflow-hidden rounded-3xl border bg-card/80 backdrop-blur-xl">

        {/* Glow */}
        <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative p-8">

          {/* Icon */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          >
            <Heart className="h-8 w-8 fill-current text-primary" />
          </motion.div>

          {/* Heading */}
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Love using NeuralLearn?
          </h2>

          <p className="mx-auto mt-4 max-w-md text-center text-muted-foreground leading-7">
            NeuralLearn is built and maintained by a single developer.
            If it has helped you study smarter, understand difficult concepts,
            or simply saved you time, you can help keep the project growing.
          </p>

          {/* Badges */}

          <div className="mt-8 flex flex-wrap justify-center gap-2">

            <Badge icon={<Brain className="h-3.5 w-3.5" />}>
              AI Powered
            </Badge>

            <Badge icon={<Sparkles className="h-3.5 w-3.5" />}>
              Free Forever
            </Badge>

            <Badge icon={<Rocket className="h-3.5 w-3.5" />}>
              Independent
            </Badge>

          </div>

          {/* Button */}

          <Button
            size="lg"
            className="mt-8 h-12 w-full rounded-xl text-base font-semibold transition-all hover:scale-[1.02]"
            onClick={() =>
              window.open(
                BUY_ME_A_COFFEE_URL,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <Coffee className="mr-2 h-5 w-5" />

            Support NeuralLearn

            <ArrowUpRight className="ml-auto h-4 w-4 opacity-70" />
          </Button>

          {/* Divider */}

          <div className="my-8 h-px bg-border" />

          {/* Why support */}

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your support helps fund
          </h3>

          <div className="space-y-3">

            <SupportItem
              icon={<Brain className="h-4 w-4" />}
              title="AI Models"
              desc="Keeping powerful AI available for everyone."
            />

            <SupportItem
              icon={<Server className="h-4 w-4" />}
              title="Cloud Infrastructure"
              desc="Hosting, storage and fast performance."
            />

            <SupportItem
              icon={<Rocket className="h-4 w-4" />}
              title="New Features"
              desc="Study tools, improvements and future updates."
            />

          </div>

          {/* Footer */}

          <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">

            <ShieldCheck className="h-4 w-4" />

            One-time donation via Buy Me a Coffee.
            Secure checkout opens in a new tab.

          </div>

        </div>
      </Card>
    </motion.div>
  );
}

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5 text-sm font-medium">
      {icon}
      {children}
    </div>
  );
}

function SupportItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">

      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>

      <div>

        <p className="font-medium">
          {title}
        </p>

        <p className="text-sm text-muted-foreground">
          {desc}
        </p>

      </div>

    </div>
  );
}