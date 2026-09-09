import type { PaperManifest, PaperQuestion } from "../../src/papers.ts";
import { choiceQuestion, essayQuestion, samplePaper, shortQuestion, textResource } from "./helpers.ts";

interface LanguageBConfig {
  subject: string;
  label: string;
  validatedFullFormat?: boolean;
  writingInstructions: string;
  readingInstructions: string;
  taskLabel?: string;
  writingTasks: readonly [string, string, string];
  readingTexts: readonly [
    { label: string; text: string },
    { label: string; text: string },
    { label: string; text: string },
  ];
  readingQuestions: PaperQuestion[];
}

const ENGLISH_B_CONFIG: LanguageBConfig = {
    subject: "english-b",
    label: "English B",
    validatedFullFormat: true,
    writingInstructions: "Choose one task. Use an appropriate text type and write 250–400 words. Enter the response in DigitalDP; no separate answer sheet is used.",
    readingInstructions: "Read all three original texts and answer every question in its linked response area. No separate answer sheet is used.",
    writingTasks: [
      "Your town plans to replace a small public park with a car park. Write a letter to the local council explaining your position and proposing a practical alternative.",
      "You recently completed one week without using food-delivery apps. Write a blog post for other students describing the experience and evaluating whether you will continue.",
      "Your school wants students to welcome new classmates more effectively. Write a set of guidelines for student mentors, explaining what they should do during a new student’s first month.",
    ],
    readingTexts: [
      {
        label: "Text A — Borrowed Ground project page",
        text: `BORROWED GROUND
A free walking project made by the people who know the streets

[1] Visitors often arrive in Bellweather carrying a list of famous places. They photograph the clock tower, cross the old bridge and leave believing that they have seen the town. Borrowed Ground offers a different kind of map: six short walks designed by residents whose names do not usually appear in guidebooks.

[2] Each route begins with an ordinary object. Follow a baker's wooden spoon to discover the night workers who keep the town awake. Choose the blue football scarf to hear how an empty car park became a weekend sports ground. The objects appear on signs along the route, but there are no arrows. Instead, walkers receive clues recorded by the residents themselves. You may get briefly lost. That is part of the invitation.

[3] The project began when local historian Reena Shah noticed that official tours treated Bellweather's past as something complete. "The dates were correct," she explains, "but the story always stopped before the people living here now had anything to say." She invited shopkeepers, students and bus drivers to record three-minute memories. More than eighty recordings arrived in a week.

[4] Borrowed Ground is free. Pick up a paper map at the central library or download the low-data version to a phone. Headphones are recommended, although every recording also has a transcript. Routes take between 35 and 70 minutes and are step-free unless the map says otherwise. Walk alone, with friends or as a class.

[5] Please remember that these are working streets, not museum displays. Keep entrances clear, ask before photographing people and buy something only if you genuinely want it. The project does not measure success by the number of visitors. It asks whether visitors leave with a more complicated picture than the one they brought.`,
      },
      {
        label: "Text B — Fixing more than machines",
        text: `FIXING MORE THAN MACHINES
An interview for Tomorrow Made magazine

[1] On Wednesday afternoons, Room 14 at North Quay College sounds like a collection of small disasters. A fan clicks without turning. A radio produces one stubborn note. Someone has removed forty-three screws from a coffee machine and arranged them in worried rows. This is the Repair Studio, a student-led service where local residents bring broken household objects and nobody promises a quick solution.

[2] Magazine reporter Joel Emery spoke to Amara Voss, one of the students who started it.

JOEL: People can already take faulty objects to professionals. Why build a repair service at a college?

AMARA: We are not trying to replace professional technicians. Our first rule is to refuse work involving gas, high-voltage equipment or anything that could be unsafe. But many objects are discarded because the owner cannot identify a simple fault, or because a commercial repair would cost more than a replacement. We can investigate slowly. Time is the resource students have.

JOEL: Was the environmental argument what attracted volunteers?

AMARA: That was our advertisement: reduce waste, learn practical skills. The surprise was the conversation. Owners usually stay while we work. They explain where an object came from and why it matters. One woman brought a lamp that had belonged to her grandfather. Electrically, it was uncomplicated. Emotionally, replacing it was impossible.

JOEL: Do customers ever become impatient with learners?

AMARA: Of course. At first we wrote "free repairs" on the poster, which sounded like a guarantee. Now we say "free investigation". We explain that the object may leave in the same condition, but its owner will know more. Oddly, complaints fell when our promise became smaller.

JOEL: What has the studio changed for students?

AMARA: It has made uncertainty respectable. In ordinary lessons, we often hide the steps that did not work and present the final answer. Here, a failed test is useful information. We photograph each stage, label every part and leave notes for the next team. Students who were nervous about touching a screwdriver now teach visitors how to clean a filter or replace a plug.

JOEL: What comes next?

AMARA: We are creating short guides in the five languages most commonly spoken near the college. But I do not want the studio to become a repair factory. If we rush people through, we lose the patient exchange that makes the room valuable.`,
      },
      {
        label: "Text C — The room above the weather",
        text: `THE ROOM ABOVE THE WEATHER
An original literary extract

[1] The greenhouse stood on the roof of Tower Seven, one floor above the number shown in the lift. To reach it, residents had to climb a final flight of concrete stairs and push a door that complained in every season. Mara had lived in the tower for nine years before she discovered the place. She found it only because a handwritten notice had appeared beside the post boxes: TOMATOES NEED WITNESSES. THURSDAY, 6 P.M.

[2] At six fifteen, Mara was the only witness. Inside, six tomato plants leaned against lengths of string. Their leaves touched the fogged glass like hands testing bathwater. A man in a red woollen hat was transferring rainwater from one bucket to another with a measuring cup.

"You're late," he said.

"I didn't know attendance was compulsory."

"It isn't. That's why I worried nobody would come."

[3] His name was Dae. The plants, he explained, had appeared three months earlier, placed in perfect pots with no note. He had watered them because the soil was dry. Then he had continued because stopping felt like making a decision. Now the first tomatoes were turning orange and he believed the unknown gardener should be invited to see them.

"So you put up a notice?"

"Seven notices. The others were too normal."

[4] Mara looked down through the glass at windows brightening across the neighbouring towers. From street level the buildings seemed identical, but up here each rectangle held a separate weather system: blue television light, yellow kitchens, a bedroom flashing briefly as curtains closed. She knew several residents by sound—the child practising scales on level twelve, the dog that barked whenever the rubbish truck reversed—but she could not have named their faces.

[5] The next Thursday, four people came. One was a boy carrying a library book about insects. Another was Mrs Alves from level three, who inspected the plants and immediately removed two dying leaves. "Too much kindness," she said when Dae protested. "A plant can drown in attention." Nobody admitted to owning the tomatoes.

[6] By the fourth week, the mystery had become less urgent. Someone brought mint. Someone else repaired a cracked pane with transparent tape that whistled in the wind. The boy counted seven kinds of visiting insect and revised the number twice. Mara began carrying her dinner upstairs after work, telling herself that the greenhouse was simply cooler than her apartment.

[7] In late August, a storm arrived before sunset. Dae sent a message to the group they had somehow formed: GLASS ROOF. STRONG WIND. HELP. Mara expected three or four people. Seventeen climbed the complaining stairs. They tied the pots to benches, moved the smallest plants into the stairwell and held a sheet of plastic over the cracked pane while rain drummed above their heads. Mrs Alves gave instructions in two languages and gesture supplied the rest.

[8] The power failed. For a moment the towers opposite went dark, every separate square erased. Then phone lights appeared around Mara, illuminating wet sleeves and the leaves they were trying to save. Someone began to laugh. The sound moved through the greenhouse until even Dae, still gripping the plastic, had to sit down.

[9] The next morning, Mara found a bowl outside her door containing three storm-split tomatoes. Beneath it lay a note in the same handwriting as the first: THANK YOU FOR WITNESSING. She carried the bowl upstairs. Nobody there claimed to have written the message, and this time she believed them.`,
      },
    ],
    readingQuestions: [
      shortQuestion("q1", "Text A · Question 1", "According to paragraph 1, what mistaken belief may visitors have when they leave Bellweather?", 1, ["text-1"]),
      shortQuestion("q2", "Text A · Question 2", "Who designed the six Borrowed Ground walks?", 1, ["text-1"]),
      shortQuestion("q3", "Text A · Question 3", "Give one example of an ordinary object used to begin a route.", 1, ["text-1"]),
      choiceQuestion("q4", "Text A · Question 4", "Why do the routes use recorded clues instead of arrows?", ["To invite exploration rather than direct every step", "To prevent residents from finding the routes", "To make the walks cost less to maintain", "To keep visitors away from the town centre"], 1, ["text-1"]),
      choiceQuestion("q5", "Text A · Question 5", "What does Reena mean when she says the official story was ‘complete’?", ["It left no space for present-day residents", "It contained too many historical errors", "It included every recording residents sent", "It concentrated only on recent events"], 1, ["text-1"]),
      shortQuestion("q6", "Text A · Question 6", "Give one way a walker can access the route information.", 1, ["text-1"]),
      choiceQuestion("q7", "Text A · Question 7", "Which statement is supported by paragraph 4?", ["Accessibility information is supplied for each route", "Every route can be completed in 35 minutes", "A mobile phone is required for every route", "The recordings are available only through headphones"], 1, ["text-1"]),
      shortQuestion("q8", "Text A · Question 8", "Identify one request made of visitors in paragraph 5.", 1, ["text-1"]),
      choiceQuestion("q9", "Text A · Question 9", "The final sentence suggests that the project's main aim is to make visitors…", ["question a simple impression of the town", "remember every historical date", "spend more money in local shops", "complete all six routes"], 1, ["text-1"]),
      shortQuestion("q10", "Text A · Question 10", "Using three details from the text, explain how Borrowed Ground gives residents authority over the way their town is represented.", 3, ["text-1"]),

      shortQuestion("q11", "Text B · Question 11", "Why does the writer compare Room 14 to ‘a collection of small disasters’ in paragraph 1?", 1, ["text-2"]),
      choiceQuestion("q12", "Text B · Question 12", "Which work will the Repair Studio refuse?", ["Potentially unsafe repairs", "Objects with emotional value", "Repairs that take several weeks", "Objects previously examined by professionals"], 1, ["text-2"]),
      shortQuestion("q13", "Text B · Question 13", "What advantage do students have that commercial repair services may not have?", 1, ["text-2"]),
      choiceQuestion("q14", "Text B · Question 14", "What surprised Amara about the owners who visited?", ["They valued the conversations around their objects", "They preferred replacing objects immediately", "They refused to remain while students worked", "They were mainly professional technicians"], 1, ["text-2"]),
      shortQuestion("q15", "Text B · Question 15", "Why was replacing the grandfather's lamp ‘impossible’ for its owner?", 1, ["text-2"]),
      shortQuestion("q16", "Text B · Question 16", "What did the phrase ‘free repairs’ lead customers to expect?", 1, ["text-2"]),
      choiceQuestion("q17", "Text B · Question 17", "What happened after the studio advertised a smaller promise?", ["Customers complained less", "Students repaired fewer objects", "Professionals joined the service", "Owners stopped asking questions"], 1, ["text-2"]),
      shortQuestion("q18", "Text B · Question 18", "In the phrase ‘present the final answer’, what does ‘the final answer’ refer to?", 1, ["text-2"]),
      shortQuestion("q19", "Text B · Question 19", "Give two practices the teams use so that another group can continue their work.", 2, ["text-2"]),
      choiceQuestion("q20", "Text B · Question 20", "Which word best describes Amara's attitude towards uncertainty?", ["Accepting", "Impatient", "Embarrassed", "Suspicious"], 1, ["text-2"]),
      choiceQuestion("q21", "Text B · Question 21", "Why does Amara not want a ‘repair factory’?", ["Efficiency could remove the valuable human exchange", "The college intends to close Room 14", "Students are no longer interested in repairing things", "Translations make the service too expensive"], 1, ["text-2"]),
      shortQuestion("q22", "Text B · Question 22", "Give one way the interview challenges the idea that a successful repair service is measured only by the number of objects fixed.", 1, ["text-2"]),

      shortQuestion("q23", "Text C · Question 23", "What prevented the lift from taking residents directly to the greenhouse?", 1, ["text-3"]),
      shortQuestion("q24", "Text C · Question 24", "Why did the unusual wording of the notice succeed in attracting Mara?", 1, ["text-3"]),
      shortQuestion("q25", "Text C · Question 25", "What two explanations does Dae give for continuing to care for the plants?", 1, ["text-3"]),
      choiceQuestion("q26", "Text C · Question 26", "What does the phrase ‘a separate weather system’ emphasize about the apartments?", ["Each contains a private life largely unknown to neighbours", "Every resident experiences different outdoor weather", "The tower's heating system is unreliable", "Mara can predict storms by watching windows"], 1, ["text-3"]),
      choiceQuestion("q27", "Text C · Question 27", "Mrs Alves says a plant can ‘drown in attention’. What is she warning against?", ["Overwatering", "Removing leaves", "Growing plants indoors", "Inviting too many visitors"], 1, ["text-3"]),
      shortQuestion("q28", "Text C · Question 28", "Give one detail showing that the greenhouse gradually became a shared place.", 1, ["text-3"]),
      choiceQuestion("q29", "Text C · Question 29", "Why does Mara tell herself the greenhouse is cooler than her apartment?", ["She is reluctant to admit that she enjoys the company", "She needs a scientific reason to study the plants", "She has been ordered to eat away from home", "She is worried that Dae owns the greenhouse"], 1, ["text-3"]),
      shortQuestion("q30", "Text C · Question 30", "How does the number of people who arrive during the storm differ from Mara's expectation?", 1, ["text-3"]),
      shortQuestion("q31", "Text C · Question 31", "What allows Mrs Alves to communicate when not everyone shares a language?", 1, ["text-3"]),
      choiceQuestion("q32", "Text C · Question 32", "What is the main effect of the power failure in paragraph 8?", ["It reveals the group as a new source of light and connection", "It makes the residents abandon the greenhouse", "It proves the storm has destroyed the other towers", "It allows the writer of the notes to escape unseen"], 1, ["text-3"]),
      shortQuestion("q33", "Text C · Question 33", "Explain two ways the repeated idea of ‘witnessing’ changes meaning between the first and final notices.", 2, ["text-3"]),
      shortQuestion("q34", "Text C · Question 34", "Using evidence from three different moments in the extract, explain how the greenhouse changes Mara's understanding of the people around her.", 3, ["text-3"]),
    ],
};

function languageBSamples(config: LanguageBConfig): PaperManifest[] {
  const writingQuestions = config.writingTasks.map((prompt, index) => essayQuestion(
    `q${index + 1}`,
    `${config.taskLabel ?? "Task"} ${index + 1}`,
    prompt,
    30,
    [],
    { min: 250, max: 400 },
  ));
  return [
    samplePaper({
      subject: config.subject,
      subjectLabel: config.label,
      level: "SL",
      paper: config.validatedFullFormat
        ? "Paper 1 (SL) — original full-format practice"
        : "Paper 1 (SL) — original format rehearsal",
      durationMinutes: 75,
      readingTimeMinutes: 5,
      maximumMarks: 30,
      mode: "essay",
      instructions: config.writingInstructions,
      selectionMode: "one",
      resources: [],
      questions: writingQuestions,
    }),
    samplePaper({
      subject: config.subject,
      subjectLabel: config.label,
      level: "HL",
      paper: config.validatedFullFormat
        ? "Paper 2 reading (HL) — original full-format practice"
        : "Paper 2 reading (HL) — original format rehearsal",
      durationMinutes: 60,
      readingTimeMinutes: 5,
      maximumMarks: config.readingQuestions.reduce((sum, question) => sum + (question.marks ?? 0), 0),
      mode: "reading",
      instructions: config.readingInstructions,
      selectionMode: "all",
      resources: config.readingTexts.map((source, index) => textResource(`text-${index + 1}`, source.label, source.text)),
      questions: config.readingQuestions,
    }),
  ];
}

const ENGLISH_B_PAPERS = languageBSamples(ENGLISH_B_CONFIG);

// The one IB example exam bundled into a release: English B Paper 2 reading (HL).
// Lives in its own module so a compiled release embeds only the English B source,
// not the full development sample set across every subject.
export const RELEASE_SAMPLE_PAPER: PaperManifest = ENGLISH_B_PAPERS.find(
  (paper) => paper.subject === "english-b" && paper.mode === "reading",
)!;

// Re-exported for the development sample set in languages.ts.
export { ENGLISH_B_PAPERS };
