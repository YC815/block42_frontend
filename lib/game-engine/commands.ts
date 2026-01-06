/**
 * Block42 Frontend - Command helpers
 * Provides command metadata and config-based availability.
 */

import type { Command, CommandSet } from "./types";
import type { CommandType, LevelConfig } from "@/types/api";

export const BASE_COMMANDS: CommandType[] = [
  "move",
  "turn_left",
  "turn_right",
  "paint_red",
  "paint_green",
  "paint_blue",
  "f0",
  "f1",
  "f2",
];

export function getAvailableCommands(config: LevelConfig): CommandType[] {
  const commands: CommandType[] = ["move", "turn_left", "turn_right"];

  if (config.tools.paint_red) commands.push("paint_red");
  if (config.tools.paint_green) commands.push("paint_green");
  if (config.tools.paint_blue) commands.push("paint_blue");

  if (config.f0 > 0) commands.push("f0");
  if (config.f1 > 0) commands.push("f1");
  if (config.f2 > 0) commands.push("f2");

  return commands;
}

export function createEmptyCommandSet(): CommandSet {
  return { f0: [], f1: [], f2: [] };
}

export function serializeCommand(command: Command): string {
  return command.condition ? `${command.type}:${command.condition}` : command.type;
}

export function serializeCommands(commands: Command[]): string[] {
  return commands.map(serializeCommand);
}
