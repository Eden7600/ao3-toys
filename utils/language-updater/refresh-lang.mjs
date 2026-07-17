import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { writeFile } from "fs/promises";

try {
  const res = await fetch("https://archiveofourown.org/works/search");
  const text = await res.text();
  const dom = new JSDOM(text);
  const langSelect = dom.window.document.getElementById("work_search_language_id");

  if (!langSelect) throw new Error("Language select element not found");

  const items = Array.from(langSelect.options)
    .map((option) => ({
      text: option.text,
      value: option.value,
    }))
    .filter((item) => item.text && item.value);

  console.log("Fetched language options:", items);

  await writeFile("./src/assets/languages.json", JSON.stringify(items, null, 2));

  console.log('Languages saved to "languages.json"');
} catch (error) {
  console.error("Failed to fetch languages:", error);
}
