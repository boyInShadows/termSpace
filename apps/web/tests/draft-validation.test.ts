import { beforeEach, describe, expect, it } from "vitest";
import { evaluateDraft, serverDraftIssues } from "@/features/creator/draft-validation";

function form(html: string) {
  document.body.innerHTML = `<form>${html}</form>`;
  return document.querySelector("form")!;
}
const about = `<section data-draft-step="0"><input name="nameEn" required value="Example"><textarea name="descriptionEn">Description</textarea><textarea name="descriptionFa"></textarea></section>`;
beforeEach(() => { document.body.innerHTML = ""; });
describe("applicable draft step evaluation", () => {
  it("does not penalize blank optional fields or disclosure toggles", () => {
    const element = form(`${about}<section data-draft-step="0"><details><input type="url" name="icon"></details></section>`);
    expect(evaluateDraft(element, "en")[0]).toEqual({ requiredComplete: true, issues: [] });
    element.querySelector("details")!.open = true;
    expect(evaluateDraft(element, "en")[0].issues).toEqual([]);
    element.querySelector<HTMLInputElement>("[name=icon]")!.value = "https://example.com/image.png";
    const state = evaluateDraft(element, "en")[0];
    expect(state.requiredComplete).toBe(true);
    expect(state.issues[0].message).toContain("avatars.githubusercontent.com");
  });
  it("requires a trimmed value and one description in either language", () => {
    const element = form(`<section data-draft-step="0"><input name="nameEn" required value="   "><textarea name="descriptionEn"></textarea><textarea name="descriptionFa"></textarea></section>`);
    expect(evaluateDraft(element, "fa")[0].issues).toHaveLength(2);
    element.querySelector<HTMLInputElement>("[name=nameEn]")!.value = "Example";
    element.querySelector<HTMLTextAreaElement>("[name=descriptionFa]")!.value = "توضیحات فارسی";
    expect(evaluateDraft(element, "fa")[0].requiredComplete).toBe(true);
    expect(evaluateDraft(element, "fa")[0].issues).toEqual([]);
  });
  it("counts only mounted source/type fields and does not ignore hidden steps", () => {
    const element = form(`${about}<section data-draft-step="1" hidden><input name="commitSha" required value="branch-name"></section>`);
    expect(evaluateDraft(element, "en")[1].requiredComplete).toBe(false);
    element.querySelector("[name=commitSha]")!.remove();
    element.querySelector("[data-draft-step='1']")!.innerHTML = '<input name="projectUrl" type="url" required value="https://example.com">';
    expect(evaluateDraft(element, "en")[1].issues).toEqual([]);
  });
  it.each([
    ["projectUrl", "https://user:password@example.com", "HTTPS"],
    ["repositoryUrl", "https://example.com/repo", "github.com"],
    ["repositoryPath", "../outside", "relative"],
    ["npmVersion", "latest", "format"],
    ["commitSha", "z".repeat(40), "format"],
    ["detail_activation", " x ", "3–500"],
  ])("validates supplied %s using its applicable rule", (name, value, message) => {
    const inputType = name.endsWith("Url") ? "url" : "text";
    const element = form(`${about}<section data-draft-step="1"><input type="${inputType}" name="${name}"></section>`);
    element.querySelector<HTMLInputElement>(`[name="${name}"]`)!.value = value;
    expect(evaluateDraft(element, "en")[1].issues[0].message).toContain(message);
  });
  it("keeps optional added-row errors separate from required completeness", () => {
    const element = form(`${about}<section data-draft-step="0"><fieldset data-draft-optional-group="true"><input required data-draft-path="listing.screenshots.0.alt.en"></fieldset></section>`);
    const state = evaluateDraft(element, "en")[0];
    expect(state.requiredComplete).toBe(true);
    expect(state.issues).toHaveLength(1);
    expect(state.issues[0].missing).toBe(false);
  });
  it("validates nonempty required lists and unique declaration entries", () => {
    const element = form(`<section data-draft-step="2"><textarea name="detail_entryPaths" data-draft-list required>, ,</textarea><input type="hidden" name="environmentVariables" value='[["TOKEN"],["TOKEN"]]'><fieldset><input type="hidden" name="permissions" value='[["network_access"],["network_access"]]'><input id="permission-field"></fieldset></section>`);
    const state = evaluateDraft(element, "en")[2];
    expect(state.requiredComplete).toBe(false);
    expect(state.issues.map(issue => issue.message)).toContain("Each entry must be unique.");
  });
  it("maps API errors to dynamic row cells and source fields", () => {
    const element = form(`<section data-draft-step="1"><input id="sha" name="commitSha"><input id="path" name="repositoryPath"><input id="models" data-draft-path="release.compatibility.0.models"></section>`);
    const issues = serverDraftIssues(element, [{ path: "manifest.release.source.commitSha", message: "Invalid SHA" }, { path: "manifest.release.compatibility.0.models.1", message: "Model too long" }, { path: "manifest.release.source.path", message: "Invalid path" }]);
    expect(issues.map(issue => [issue.control.id, issue.step, issue.message])).toEqual([["sha", 1, "Invalid SHA"], ["models", 1, "Model too long"], ["path", 1, "Invalid path"]]);
  });
  it("uses the API's type-specific list limits and platform choices", () => {
    const element = form('<section data-draft-step="2"><select name="itemType"><option>hook</option></select><textarea name="detail_entryPaths" data-draft-list></textarea><textarea name="detail_initialInputs" data-draft-list></textarea><select name="detail_hostPlatform" data-draft-allowed="codex,claude-code"><option>unknown</option><option>codex</option></select></section>');
    element.querySelector<HTMLTextAreaElement>("[name=detail_entryPaths]")!.value = Array.from({ length: 51 }, (_, index) => `path-${index}`).join("\n");
    element.querySelector<HTMLTextAreaElement>("[name=detail_initialInputs]")!.value = Array.from({ length: 100 }, (_, index) => `input-${index}`).join("\n");
    expect(evaluateDraft(element, "en")[2].issues.map(issue => issue.control.name)).toEqual(["detail_entryPaths", "detail_hostPlatform"]);
  });
});
