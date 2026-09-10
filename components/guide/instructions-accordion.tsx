"use client";
import { AirVent, Waves, Droplets, KeyRound, BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Instruction } from "@/lib/types";
const icons = [AirVent, Waves, Droplets, KeyRound];
export function InstructionsAccordion({ instructions }: { instructions: Instruction[] }) {
  return (
    <Accordion type="single" collapsible className="instruction-list">
      {instructions.map((item, index) => {
        const Icon = icons[index] ?? BookOpen;
        return (
          <AccordionItem value={item.id} key={item.id}>
            <AccordionTrigger>
              <span className="instruction-label">
                <span className="instruction-icon">
                  <Icon size={19} />
                </span>
                {item.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="whitespace-pre-line ps-13">
              {item.description}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
