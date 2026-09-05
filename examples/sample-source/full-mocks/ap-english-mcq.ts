export interface EnglishMultipleChoice {
  resourceKey: string;
  skill: string;
  prompt: string;
  options: [string, string, string, string];
  correctOption: number;
  rationale: string;
}

export const AP_ENGLISH_MCQ: EnglishMultipleChoice[] = [
  {
    resourceKey: "reading-a", skill: "Rhetorical situation: purpose",
    prompt: "The writer's principal purpose in Reading set A is to",
    options: ["argue that residents' recollections should take priority over municipal documents", "advocate an accessible archive whose descriptions and methods remain open to examination", "demonstrate that digitisation is less economical than retaining printed catalogues", "defend archivists against demands to explain the decisions involved in their work"],
    correctOption: 1, rationale: "The narrative leads to qualified support for digitisation, visible descriptive decisions and evidence-based participation. Recollection does not automatically override records; no comparative cost finding is established; explaining decisions is central, not rejected.",
  },
  {
    resourceKey: "reading-a", skill: "Evidence: function of an anecdote",
    prompt: "The inscription on the photograph in paragraph 1 primarily helps the writer",
    options: ["establish that a child's memory is more dependable than a clerk's ledger", "shift attention from flooding to the history of milk distribution", "explain why photographs should be catalogued separately from written documents", "introduce the possibility that a familiar event can be described in unexpected terms"],
    correctOption: 3, rationale: "The unusual milk-by-boat description prompts a search beyond the official term flood. It supplies another route into evidence, not a hierarchy of trustworthy witnesses, a new subject or a cataloguing rule.",
  },
  {
    resourceKey: "reading-a", skill: "Style: irony and qualification",
    prompt: "The statement that the street “officially had never flooded” in paragraph 1 is best understood as",
    options: ["an ironic description of the gap between a searchable record and the event the photograph depicts", "a literal assurance that an official investigation had ruled out every possible flood", "a concession that the woman probably misunderstood what her photograph showed", "a prediction that the town would refuse to recognise any evidence provided by residents"],
    correctOption: 0, rationale: "The photograph and subsequent ledger entry expose the gap in the apparent official account. The essay reports no comprehensive investigation, dismissal of the woman or prediction of institutional refusal.",
  },
  {
    resourceKey: "reading-a", skill: "Rhetorical situation: original purpose and later audience",
    prompt: "In paragraph 2, the contrast between the clerk's task and the resident's inquiry most strongly suggests that interpreting a document requires attention to",
    options: ["whether the document's author and its later readers use the same technology", "whether a later reader has a personal rather than a professional interest in the event", "the practical purpose and situation for which the document was originally produced", "the comparative social status of the person who produced it and the person consulting it"],
    correctOption: 2, rationale: "A record made to track commercial interruption may not name the event as a later family historian would. The rhetorical situation of production matters; technology, personal status and a simple professional/personal hierarchy do not explain the filing category.",
  },
  {
    resourceKey: "reading-a", skill: "Reasoning: interpreting a central claim",
    prompt: "The claim that an index is “an argument about the routes” into an archive (paragraph 2) implies that",
    options: ["all catalogue entries must contain an explicit persuasive statement", "disagreements among archivists are the chief obstacle to public access", "choices about organisation shape which inquiries users can readily pursue", "an archive's value depends mainly on the number of ways its building can be entered"],
    correctOption: 2, rationale: "Routes is a metaphor for finding records through categories and descriptions. The claim concerns consequential organisation, not explicit essays, staff disputes or physical entrances.",
  },
  {
    resourceKey: "reading-a", skill: "Reasoning and organisation: concession",
    prompt: "The examples of former residents, shift workers and distant students in paragraph 3 develop the argument by",
    options: ["acknowledging a substantial benefit of digitisation before identifying what access still requires", "limiting the archive's intended audience to people unable to visit in person", "proposing that remote users should receive priority over residents in the reading room", "showing that the original photograph problem would disappear if every record were scanned"],
    correctOption: 0, rationale: "These groups demonstrate genuine expanded access, qualifying criticism of the portal. They do not exhaust the audience, establish priority or prove that scanning fixes descriptive gaps.",
  },
  {
    resourceKey: "reading-a", skill: "Rhetorical situation: anticipated audience assumptions",
    prompt: "The writer's response to invitations to tell the story as a warning against computers (paragraph 3) suggests an awareness of listeners who",
    options: ["have already concluded that travelling to an archive is impossible for every resident", "want the archive to discard every document that has been scanned", "consider remote users less interested in evidence than visitors to the reading room", "regard older in-person research methods as more authentic and therefore preferable"],
    correctOption: 3, rationale: "The writer counters the nostalgic appeal to authenticity by naming the old system's exclusion. The passage does not establish universal travel impossibility, disposal of originals or contempt for remote users.",
  },
  {
    resourceKey: "reading-a", skill: "Style: comparison and rhetorical effect",
    prompt: "In paragraph 4, comparing a title and date to “the paper's weight” emphasises that a search result can",
    options: ["make digital copies seem physically heavier than their originals", "present interpretive labels as though they were unproblematic physical properties", "encourage users to investigate the conservation needs of paper documents", "make approximate dates more useful than accurately measured quantities"],
    correctOption: 1, rationale: "The comparison exposes apparent naturalness: descriptive decisions can look inherent to the object. Nothing suggests physical weight changes, conservation advice or a preference for approximate dates.",
  },
  {
    resourceKey: "reading-a", skill: "Style: meaning in context",
    prompt: "In the claim that visible decisions would make records “answerable” (paragraph 4), “answerable” most nearly means",
    options: ["capable of answering every question a user asks", "dependent on the approval of the most frequent users", "arranged so that questions can be answered more quickly", "open to scrutiny and a reasoned request for justification"],
    correctOption: 3, rationale: "The following uncertain-label example and later source-checking guidance concern accountability and examination. The word does not promise complete answers, speed or majority approval.",
  },
  {
    resourceKey: "reading-a", skill: "Reasoning: qualification and counterargument",
    prompt: "Paragraph 5 qualifies the preceding criticism of catalogues by arguing that",
    options: ["an incomplete catalogue cannot be improved through public participation", "a failed search alone cannot establish that someone deliberately suppressed a history", "uncertain records should be withheld until every ambiguity has been resolved", "teaching research methods is less important than increasing the number of records"],
    correctOption: 1, rationale: "The paragraph supplies alternative explanations for absence and calls for investigation. It supports informed participation and research teaching rather than secrecy or scanning alone.",
  },
  {
    resourceKey: "reading-a", skill: "Evidence: evaluating measures of success",
    prompt: "The budget comparison in paragraph 6 most clearly distinguishes between",
    options: ["the volume of material made available and the practical ability to find useful material", "the historical importance of old documents and that of recently created documents", "residents who prefer photographs and researchers who prefer written ledgers", "the low cost of scanning and the high cost of employing an archive assistant"],
    correctOption: 0, rationale: "Batch size creates a visible output measure, whereas better descriptions improve discovery. The essay does not compare periods, audience preferences or the actual costs of the two proposals.",
  },
  {
    resourceKey: "reading-a", skill: "Style and organisation: concluding metaphor",
    prompt: "The contrast between a “workshop” and a “verdict” in the final paragraph reinforces the writer's view that archives should",
    options: ["replace professional research with unrestricted public debate", "focus on practical crafts rather than disputes over the past", "support continuing evidence-based inquiry rather than imply that an account is beyond revision", "avoid reaching any conclusions because historical evidence is always incomplete"],
    correctOption: 2, rationale: "The woman obtains an answer and a further question: findings remain possible but revisable. Workshop does not eliminate expertise, change the subject to crafts or make all conclusions impossible.",
  },
  {
    resourceKey: "reading-b", skill: "Rhetorical situation: central purpose",
    prompt: "Reading set B primarily argues that scientific records are most useful when they",
    options: ["replace maps that simplify the landscape with complete descriptions of every observation", "demonstrate that a researcher reached the correct answer on the first visit", "preserve the basis and limits of judgments so that later observers can revise them", "privilege older handwritten observations over readings from newer instruments"],
    correctOption: 2, rationale: "The essay repeatedly links recorded context, uncertainty and testable revision. It accepts useful simplification and digital instruments and rejects certainty as a certificate of expertise.",
  },
  {
    resourceKey: "reading-b", skill: "Reasoning: contrast in the introduction",
    prompt: "The distinction between knowing “where I stood” and “what, exactly, I had located” in paragraph 1 establishes a contrast between",
    options: ["precise position measurement and interpretation of the material found there", "a published map's age and the physical age of the rocks it represents", "the researcher's confidence before a journey and fear of getting lost during it", "the ease of using instruments and the difficulty of learning to write field notes"],
    correctOption: 0, rationale: "The receiver resolves location but not whether the rock originated there or moved downhill. Age, navigation anxiety and notebook-writing difficulty are not the central contrast.",
  },
  {
    resourceKey: "reading-b", skill: "Evidence: significance of a quoted word",
    prompt: "The writer's discussion of “probably” in paragraph 2 treats the word as",
    options: ["evidence that the earlier researcher had not completed the assigned survey", "a useful indication of how much confidence the recorded observation warranted", "an unfortunate stylistic habit that publication should have removed", "a warning that the notebook's measurements should not be trusted at all"],
    correctOption: 1, rationale: "Probably preserves the strength of the inference, rather than proving unfinished work or total unreliability. Calling it information expressly rejects the editing-blemish interpretation.",
  },
  {
    resourceKey: "reading-b", skill: "Style: analogy",
    prompt: "The reference to a printer's invoice in paragraph 3 supports the point that",
    options: ["scientific publications should disclose the financial interests behind every survey", "readers usually underestimate the labour required to publish a map", "the details omitted from a map are as irrelevant as printing costs", "a useful finished product need not display every detail of its production"],
    correctOption: 3, rationale: "The analogy concedes selective presentation; the following sentences distinguish not displaying all working from losing access to it. It does not make every omitted observation irrelevant or introduce financial disclosure.",
  },
  {
    resourceKey: "reading-b", skill: "Reasoning and organisation: paragraph relationship",
    prompt: "Paragraph 4 develops paragraph 3 chiefly by",
    options: ["challenging the earlier paragraph's claim that maps must simplify", "illustrating how contextual notes can help explain a discrepancy that a finished record cannot resolve alone", "showing that an old observation remains accurate even when the landscape has changed", "introducing a competing account of why the earlier researcher abandoned the survey"],
    correctOption: 1, rationale: "The stream example puts the map/notebook distinction into practice: old contextual details explain a changed location. It neither rejects simplification nor says the stream stayed in place.",
  },
  {
    resourceKey: "reading-b", skill: "Style: personification",
    prompt: "The statement that “the stream refused the description” in paragraph 4 gives emphasis to",
    options: ["the stream's exceptional force during a recent flood", "the earlier researcher's unwillingness to name a watercourse", "the narrator's preference for informal rather than technical language", "the resistance of the observed landscape to the narrator's expectation"],
    correctOption: 3, rationale: "The stream does not match the expected position despite confirmed coordinates. Personification dramatizes this mismatch; the passage establishes neither a flood nor a dispute over naming.",
  },
  {
    resourceKey: "reading-b", skill: "Evidence: interpreting an example",
    prompt: "In the stream episode, the receiver and notebook prove valuable because they",
    options: ["supply independent measurements that confirm an unchanged channel", "show that the notebook's coordinates are more precise than the receiver's", "provide different kinds of information that become useful in combination", "allow the researcher to dispense with further direct observation"],
    correctOption: 2, rationale: "The receiver supplies current position and the notebook makes an earlier position intelligible. Their value is complementary, not identical, hierarchical or a replacement for field observation.",
  },
  {
    resourceKey: "reading-b", skill: "Rhetorical situation: anticipating a reader's misinterpretation",
    prompt: "The discussion of sensors and digital photographs in paragraph 5 primarily prevents readers from concluding that the writer",
    options: ["regards uncertainty-preserving observation as possible only with traditional materials", "believes different observers can notice different features of one place", "thinks measurements should be reconsidered when conditions change", "values an instrument's patient record of changes over time"],
    correctOption: 0, rationale: "The explicit rejection of damp-paper nostalgia and praise of digital records show that the principle concerns recording practices, not one medium. The other conclusions are compatible with the writer's argument.",
  },
  {
    resourceKey: "reading-b", skill: "Claims and evidence: operationalising a principle",
    prompt: "The example “I would change my mind if the layer continued beyond the fault” (paragraph 6) is important because it",
    options: ["identifies a specific observation that could test an interpretation", "makes a general concession that all interpretations are equally plausible", "protects the researcher from being held responsible for an incorrect identification", "substitutes an expression of personal confidence for field evidence"],
    correctOption: 0, rationale: "The conditional names what would trigger revision, making uncertainty operational. The writer contrasts it with a decorative admission that anything is possible.",
  },
  {
    resourceKey: "reading-b", skill: "Rhetorical situation: audience and collaboration",
    prompt: "Describing the notebook as instructions for a person who may “disagree intelligently” (paragraph 6) reframes field notes as",
    options: ["private writing intended mainly to reassure an anxious novice", "a formal set of rules that later investigators must follow without modification", "a means of enabling subsequent investigators to engage with and test a judgment", "a published argument addressed only to researchers who already share the author's conclusions"],
    correctOption: 2, rationale: "Notes help another observer know what to test and potentially revise. They are neither private reassurance nor mandatory rules and do not require agreement.",
  },
  {
    resourceKey: "reading-b", skill: "Evidence: visual convention and qualification",
    prompt: "In paragraph 7, the dotted section of the boundary represents",
    options: ["an area where geological processes have not yet produced a distinct history", "the researcher's decision to give competing accounts equal status", "a part of the hillside that the receiver failed to locate accurately", "a distinction between levels of confidence within the researcher's own account"],
    correctOption: 3, rationale: "The writer explicitly defines the dots as lower confidence, rejecting the absence-of-history and equal-accounts interpretations. The receiver's positional accuracy is not the problem.",
  },
  {
    resourceKey: "reading-b", skill: "Reasoning and organisation: conclusion",
    prompt: "The later photograph and movement of the boundary in the final paragraph chiefly serve to",
    options: ["undermine the earlier claim that the notebooks had practical value", "demonstrate the productive revision that transparent field records make possible", "suggest that winter observations should replace all summer fieldwork", "resolve the writer's uncertainty by establishing that maps can now be permanent"],
    correctOption: 1, rationale: "New evidence becomes usable because the record preserved a revisable claim. Revision illustrates the argument rather than discredits it or establishes seasonal superiority or permanence.",
  },
  {
    resourceKey: "draft-c", skill: "Rhetorical situation — Writing: addressing a cautious audience",
    prompt: "The writer wants to replace sentence 3 with a statement that encourages librarians to consider the trial while respecting their concerns about safety and workload. Which revision best accomplishes this?",
    options: ["Since tools and books are both physical objects, the library should use identical rules for lending them.", "Libraries should avoid lending objects whose possible uses cannot be listed in advance.", "Every successful tool collection proves that a library can expand its services without any extra spending.", "The library's lending experience provides a useful starting point, but tools require additional safety and maintenance arrangements."],
    correctOption: 3, rationale: "This preserves the relevance of lending experience while acknowledging the specific operational demands developed in the article. The alternatives overgeneralise, reject the proposal or assert unsupported cost certainty.",
  },
  {
    resourceKey: "draft-c", skill: "Claims and evidence — Writing: relevant supporting evidence",
    prompt: "The writer wants to add evidence after sentence 2 that most directly supports the claim about making occasional repairs less expensive. Which invented finding would best serve that purpose?",
    options: ["In a pilot, borrowers who completed a one-time repair reported paying a small loan fee instead of buying equipment they did not otherwise need.", "The library catalogue recorded an increase in the number of books with repair-related words in their titles.", "A survey found that residents preferred a tool cabinet made of metal to one made of wood.", "Several nearby libraries recently changed the opening hours of their reading rooms."],
    correctOption: 0, rationale: "Avoided purchase costs for one-time repairs directly support the economic claim. Catalogue terms, cabinet preference and unrelated hours do not demonstrate the claimed saving.",
  },
  {
    resourceKey: "draft-c", skill: "Reasoning and organisation — Writing: evaluating commentary and examples",
    prompt: "Should the writer keep sentence 8?",
    options: ["No, because introducing a volunteer shifts the article's focus from equipment to a biography.", "No, because a newsletter argument may use statistics but not an individual's observation.", "Yes, because it gives a concrete reason that the instruction arrangements in sentence 7 matter.", "Yes, because it establishes that every volunteer has the expertise to approve every available tool."],
    correctOption: 2, rationale: "Knowing when not to use equipment illustrates why instruction has safety value. One sentence is not a biography, anecdotal evidence is not prohibited, and the observation establishes no universal expertise.",
  },
  {
    resourceKey: "draft-c", skill: "Reasoning and organisation — Writing: maintaining focus",
    prompt: "Which sentence would be best deleted because it interrupts the reasoning of its paragraph?",
    options: ["Sentence 10", "Sentence 12", "Sentence 13", "Sentence 15"],
    correctOption: 1, rationale: "The storeroom's faded paint does not address displacement, staffing or evaluation. Sentence 10 fairly frames objections; 13 adds accountability; 15 develops the later access issue.",
  },
  {
    resourceKey: "draft-c", skill: "Style — Writing: parallel structure and emphasis",
    prompt: "The writer wants to revise sentence 15 so that parallel phrasing emphasises the two different ways borrowing rules could exclude users. Which version best accomplishes this?",
    options: ["A large deposit could bar residents short of money; an online-only booking system could bar residents without reliable internet access.", "Residents need money and internet access, so the rules should not be mentioned until after they have joined the library.", "Although booking takes place online, a deposit is a sum of money that the library asks someone to pay.", "Deposits and online bookings are different things, and the library has many rules about the services that members may use."],
    correctOption: 0, rationale: "Matched clauses preserve distinct barriers and emphasise their shared exclusionary effect. The alternatives conceal rules, merely define terms or replace specific consequences with vague statements.",
  },
  {
    resourceKey: "draft-c", skill: "Claims and evidence — Writing: identifying a necessary qualification",
    prompt: "The writer is considering adding “No borrower would ever have to pay to replace lost equipment” after sentence 16. Which is the best reason NOT to add it?",
    options: ["It repeats the exact information already provided by sentence 11.", "It makes the argument too specific for an article addressed to local residents.", "It shifts the article from a discussion of tools to a discussion of printed books.", "It makes an unsupported absolute promise about replacement costs where the proposal calls for a modest, clearly explained policy."],
    correctOption: 3, rationale: "Sentence 16 calls for a replacement policy that recognises the cost of lost equipment; it does not promise that every borrower would be exempt from payment. The blanket exemption goes beyond the qualified proposal. It is neither repetition of staffing information nor an audience/detail problem.",
  },
  {
    resourceKey: "draft-c", skill: "Style — Writing: maintaining a qualified, practical tone",
    prompt: "Which replacement for sentence 18 best preserves the article's cautiously encouraging, practical tone while bringing it to a close?",
    options: ["Libraries have changed many times, so their future cannot be predicted with any confidence.", "The council should buy as many tools as possible before deciding how the collection will operate.", "A modest trial with visible costs and accessible rules would let Northbank test the promise of sharing without hiding the work it requires.", "A collection of tools will be popular because most people occasionally need a tool."],
    correctOption: 2, rationale: "This synthesises the trial, operational transparency and access conditions. The other endings retreat into uncertainty, reverse the planned sequence or merely restate an unsupported prediction of popularity.",
  },
  {
    resourceKey: "draft-d", skill: "Rhetorical situation — Writing: introduction and credibility",
    prompt: "The writer wants to keep the personal opening without implying that one experience proves a town-wide result. Which sentence most clearly performs that qualification?",
    options: ["Sentence 1", "Sentence 3", "Sentence 9", "Sentence 19"],
    correctOption: 1, rationale: "Sentence 3 explicitly limits what the anecdote establishes and turns it into a question for investigation. The other sentences introduce experience, a trial or the conclusion without that qualification.",
  },
  {
    resourceKey: "draft-d", skill: "Claims and evidence — Writing: revising a generalisation",
    prompt: "Which replacement for sentence 7 best supports the reasoning in sentence 8?",
    options: ["The appearance of a new lamp is the most reliable guide to its environmental effects.", "The council should assume that an old lamp always uses more electricity than any newer replacement.", "An efficient lamp may save little overall if many more lamps are installed or they operate for longer hours.", "Residents are unlikely to notice environmental changes if the new lamps look like the old ones."],
    correctOption: 2, rationale: "This explains why whole-installation use matters despite per-lamp efficiency. The alternatives rely on appearance or unsupported absolutes instead of connecting efficiency, quantity and operating time.",
  },
  {
    resourceKey: "draft-d", skill: "Reasoning and organisation — Writing: integrating limiting evidence",
    prompt: "The writer wants to add this sentence: “Consequently, the lower electricity use cannot confidently be attributed to shielding alone.” Where would it best fit?",
    options: ["Before sentence 1", "After sentence 6", "After sentence 9", "After sentence 12"],
    correctOption: 3, rationale: "Following the unrecorded variables and non-random selection, the sentence draws the causal limitation those details support, before the broader conclusion in sentence 13. The earlier placements lack that evidential basis.",
  },
  {
    resourceKey: "draft-d", skill: "Claims and evidence — Writing: evidence that strengthens a claim",
    prompt: "Which additional information would most strengthen an argument that the shielded installation, rather than other changes, reduced electricity use in the trial?",
    options: ["A comparison with similar unchanged streets, accounting for lamp numbers, operating hours and other relevant differences", "A photograph showing that the new lamps had a more modern appearance than the old ones", "A statement that the two trial streets were easy for council officers to reach", "A count of how often the word efficiency appeared in residents' written comments"],
    correctOption: 0, rationale: "A relevant comparison and accounting for confounding differences address attribution. Appearance, convenience of access and word frequency do not establish the installation's effect.",
  },
  {
    resourceKey: "draft-d", skill: "Style — Writing: concise, precise phrasing",
    prompt: "Which revision of sentence 15 would best preserve its role while making the shopkeepers' concern more concise?",
    options: ["Shopkeepers oppose environmental improvements because they do not understand lighting design.", "Shopkeepers agree that any reduction in wasted light must make the route safer.", "They worry that efforts to reduce wasted light could leave late customers and staff with inadequate visibility.", "They have concerns about several matters that the council may or may not be able to address."],
    correctOption: 2, rationale: "The revision accurately states the specific visibility concern without attacking motives or assuming agreement. The vague alternative loses the issue that motivates the proposed evening walks.",
  },
  {
    resourceKey: "draft-d", skill: "Claims and evidence — Writing: developing a proposal with relevant detail",
    prompt: "The writer wants to add a sentence after sentence 16 that explains how the evening walks could inform a decision. Which best does so?",
    options: ["Evening walks have sometimes been included in other kinds of community events.", "Participants could use the same checklist at each location to record whether they can recognise faces, edges and crossing hazards.", "The walks should be advertised using photographs taken from the most flattering angle.", "Because all participants will be outside together, their judgments will necessarily be identical."],
    correctOption: 1, rationale: "Consistent relevant observations make the walks useful to the comparison, while retaining different participants' perspectives. The other options are tangential, undermine the stated purpose or promise false agreement.",
  },
  {
    resourceKey: "draft-d", skill: "Style — Writing: contrast and emphasis in a conclusion",
    prompt: "Should the writer retain sentences 19 and 20 as the conclusion?",
    options: ["Yes, because their contrast returns to the article's distinction between visible brightness and useful street-level visibility.", "Yes, because they introduce an unrelated scenic viewpoint that balances the technical discussion.", "No, because the article has already proved that the dimmest arrangement is always the safest.", "No, because an argument about a local policy must conclude with a precise numerical prediction."],
    correctOption: 0, rationale: "The distant-hill/street-level contrast restates the central evaluative criterion in concrete terms. The article has not proved that dimness is always safest, and no numerical forecast is required.",
  },
  {
    resourceKey: "draft-e", skill: "Rhetorical situation — Writing: establishing common ground",
    prompt: "The department values written evidence and is cautious about the reliability of memory. Which replacement for sentence 3 best establishes common ground with these readers while encouraging them to consider interviews?",
    options: ["Interviews could preserve experiences missing from official records, but recollection also needs context and careful comparison.", "Because people remember important events, interviews eliminate the need to retain written documents.", "Written records are always impartial, whereas spoken recollections can have no historical value.", "The project should collect the largest possible number of recordings before deciding what questions to ask."],
    correctOption: 0, rationale: "The revision recognises the distinct value and limits of interviews, motivating comparison with documents. The alternatives create a false hierarchy or avoid the evidential issue.",
  },
  {
    resourceKey: "draft-e", skill: "Claims and evidence — Writing: relevant evidence and perspective",
    prompt: "The writer wants to add another perspective after sentence 6. Which sentence best develops the paragraph's reasoning?",
    options: ["The factory's buildings were made from materials common in the region at that time.", "The department owns several books with chapters about the factory's machinery.", "The town's population can be displayed using either a table or a line graph.", "A worker's child might recall changed routines at home rather than decisions made inside the factory."],
    correctOption: 3, rationale: "The child's perspective extends the paragraph's comparison of lived consequences. Building materials, book holdings and display methods do not develop the point about differing recollections.",
  },
  {
    resourceKey: "draft-e", skill: "Reasoning and organisation — Writing: organisation and commentary",
    prompt: "Where would this sentence most effectively be placed? “The purpose is not to force these memories into agreement but to make their differences available for examination.”",
    options: ["Before sentence 1", "After sentence 8", "After sentence 12", "After sentence 15"],
    correctOption: 1, rationale: "After the contrasting perspectives and checking qualification, the sentence synthesises that paragraph's purpose before the move to consent. Elsewhere, the referent these memories is less direct and the flow is interrupted.",
  },
  {
    resourceKey: "draft-e", skill: "Reasoning and organisation — Writing: relevance of an illustrative example",
    prompt: "Should sentence 11 be kept?",
    options: ["No, because a memo about historical evidence should not discuss the people who provide it.", "No, because any example makes the consent policy less applicable to future interviews.", "Yes, because it illustrates why a speaker's consent may need to be reconsidered during an interview.", "Yes, because it proves that every workplace story identifies someone who will object."],
    correctOption: 2, rationale: "The example shows how new circumstances can make consent an ongoing matter and motivates a review process. It does not claim universal objection or make all future situations identical.",
  },
  {
    resourceKey: "draft-e", skill: "Rhetorical situation — Writing: audience and credibility",
    prompt: "Which replacement for sentence 15 best advances the writer's proposal for a manageable pilot?",
    options: ["Recording quality is unimportant because the students will remember everything that speakers say.", "The project will have little value unless the department immediately purchases professional studio equipment.", "A large public collection should be announced before students learn whether the equipment works.", "Clear, reliable recordings matter, but a small project can begin with equipment that students know how to test and use."],
    correctOption: 3, rationale: "This maintains the need for usable evidence while supporting a feasible pilot and leading to borrowed equipment. The other versions dismiss reliability or impose unsupported expense and premature scale.",
  },
  {
    resourceKey: "draft-e", skill: "Rhetorical situation — Writing: responding to institutional concerns",
    prompt: "The department wants assurance that a pilot can produce usable records without making promises it cannot keep. Which addition to sentence 17 best addresses that concern?",
    options: ["including whether recordings are intelligible, consent requests can be honoured, and descriptions explain who spoke and in what circumstances", "including whether the recordings are longer than every interview previously made in the town", "including whether all speakers give the same account of the factory's final week", "including whether the microphones cost more than those used by another school"],
    correctOption: 0, rationale: "The criteria directly evaluate evidence quality, ethical promises and future usability—the memo's central conditions. Length, agreement and relative spending are not adequate substitutes.",
  },
  {
    resourceKey: "draft-e", skill: "Style — Writing: using balanced syntax to emphasise a distinction",
    prompt: "Which alternative version of sentence 18 uses balanced phrasing to emphasise the relationship between recollections and their context?",
    options: ["The number of answers is important, and the answers should be counted when the project is finally completed.", "We would preserve not only what people remember, but also the circumstances in which those memories were shared.", "Questions should be removed from the transcripts, since the answers will then appear to speak entirely for themselves.", "Because spoken accounts settle historical disputes, the department can expect a final answer from every recording."],
    correctOption: 1, rationale: "The not-only/but-also construction balances remembered content with the circumstances of its expression, preserving the central relationship. The alternatives emphasise counts, remove context or claim unsupported finality.",
  },
];
