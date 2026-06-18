import type { Character, Panel, Project } from "@/lib/studio/types";

export type DisplayLanguage = "en" | "vi";

export function getProjectOutputLanguage(project?: Project): DisplayLanguage {
  return project?.outputLanguage || "en";
}

export function getPanelScenePromptDisplay(
  panel: Panel,
  language: DisplayLanguage,
) {
  if (language === "vi") {
    return (
      panel.scenePromptDisplayVi ||
      panel.scenePromptDisplay ||
      panel.scenePrompt
    );
  }

  return panel.scenePromptDisplayEn || panel.scenePrompt;
}

export function getPanelDialogueDisplay(
  panel: Panel,
  language: DisplayLanguage,
) {
  if (language === "vi") {
    return panel.dialogueDisplayVi || panel.dialogueDisplay || panel.dialogue;
  }

  return panel.dialogueDisplayEn || panel.dialogue;
}

export function getCharacterDescriptionDisplay(
  character: Character,
  language: DisplayLanguage,
) {
  if (language === "vi") {
    return (
      character.descriptionDisplayVi ||
      character.descriptionDisplay ||
      character.description
    );
  }

  return character.descriptionDisplayEn || character.description;
}

export function getAutoBubbleSeedCandidates(panel: Panel) {
  return Array.from(
    new Set(
      [
        panel.dialogue,
        panel.dialogueDisplayEn,
        panel.dialogueDisplayVi,
        panel.dialogueDisplay,
      ].filter((value): value is string => Boolean(value && value.trim())),
    ),
  );
}

export function getPanelBubbleSeed(panel: Panel, language: DisplayLanguage) {
  return getPanelDialogueDisplay(panel, language).trim();
}

export function isSeedBubbleText(panel: Panel, bubbleText: string) {
  const cleanBubbleText = bubbleText.trim();
  if (!cleanBubbleText) {
    return false;
  }

  return getAutoBubbleSeedCandidates(panel).includes(cleanBubbleText);
}
