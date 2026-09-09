import type { PaperManifest, PaperQuestion } from "../../src/papers.ts";
import { choiceQuestion, essayQuestion, samplePaper, shortQuestion, textResource } from "./helpers.ts";
import { ENGLISH_B_PAPERS } from "./english-b.ts";

interface LanguageAConfig {
  subject: string;
  label: string;
  validatedFullFormat?: boolean;
  instructionsOne: string;
  instructionsTwo: string;
  promptLabel?: string;
  responseSuffix?: string;
  sources: readonly [
    { label: string; text: string; prompt: string },
    { label: string; text: string; prompt: string },
  ];
  comparativePrompts: readonly [string, string, string, string];
}

function languageASamples(config: LanguageAConfig): PaperManifest[] {
  const resources = config.sources.map((source, index) => textResource(`text-${index + 1}`, source.label, source.text));
  const analysisQuestions = config.sources.map((source, index) => essayQuestion(
    `q${index + 1}`,
    `${source.label} — ${config.responseSuffix ?? "response"}`,
    source.prompt,
    20,
    [`text-${index + 1}`],
  ));
  const comparativeQuestions = config.comparativePrompts.map((prompt, index) => essayQuestion(
    `q${index + 1}`,
    `${config.promptLabel ?? "Prompt"} ${index + 1}`,
    prompt,
    30,
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
      maximumMarks: 20,
      mode: "essay",
      instructions: config.instructionsOne,
      selectionMode: "one",
      resources,
      questions: analysisQuestions,
    }),
    samplePaper({
      subject: config.subject,
      subjectLabel: config.label,
      level: "HL",
      paper: config.validatedFullFormat
        ? "Paper 2 (HL) — original full-format practice"
        : "Paper 2 (HL) — original format rehearsal",
      durationMinutes: 105,
      readingTimeMinutes: 5,
      maximumMarks: 30,
      mode: "essay",
      instructions: config.instructionsTwo,
      selectionMode: "one",
      resources: [],
      questions: comparativeQuestions,
    }),
  ];
}

const languageAConfigs: LanguageAConfig[] = [
  {
    subject: "english-a-language-literature",
    label: "English A: Language and Literature",
    validatedFullFormat: true,
    instructionsOne: "Choose one original text and analyse how its language, structure and design choices shape meaning for its intended audience. Enter the response beside the chosen text; no separate answer sheet is used.",
    instructionsTwo: "Choose one prompt and compare two works studied in class. Enter the complete essay in DigitalDP; no separate answer sheet is used.",
    sources: [
      {
        label: "Text 1 — community-library campaign",
        text: `BORROW THE EVENING
The East Gate Library stays open until 10 p.m. every Thursday

NOT EVERY EVENING NEEDS A RECEIPT

At six o'clock, much of East Gate begins asking you to buy something. Cafés place small clocks beside laptops. Shopping centres brighten their signs. Even a quiet seat can arrive with the price of a drink. We think a city also needs places where time is not for sale.

That is why the East Gate Library is lending the evening.

Bring unfinished homework, a half-read novel, a job application, a friend who needs help with a form, or simply an hour you have not planned. You do not have to whisper, but you do have to share the quiet. You do not have to borrow a book, but we hope you will borrow the feeling that this building belongs to you.

THURSDAY EVENING

6:00 — The daytime desk closes; the Evening Desk opens. Return books, collect reservations or ask for help without an appointment.

7:00 — First visit? Join a ten-minute shelf tour. We will show you where the sockets hide, which tables welcome group work, and where to find a chair that faces nobody.

8:00 — The lights in the children's room soften for family reading. Stories are available in eight languages. Bring your own favourite or choose one from the floor-level shelves.

9:00 — Last cup from the community kettle. Tea is free. Wash your mug and leave it for the next Thursday.

10:00 — Doors close. Ideas may remain unfinished.

WHO IS THE EVENING FOR?

For Jia, who shares a kitchen table with three younger brothers. For Mr Ellis, whose heating costs less when he spends an evening somewhere warm. For the nursing students who finish placement after our old closing time. For the parent who wants a story but cannot translate every page. For you, including if we have not yet learned your name.

No membership card? We will make one while the kettle boils. No permanent address? Speak to us; we have a local-access card. Need step-free entry, a screen reader, a large-print keyboard or a desk away from fluorescent light? The side entrance and assistive equipment remain available all evening. If our arrangements do not work, tell us what would.

WHY ONLY THURSDAY?

Because this is a beginning, not a promise written in stone. For twelve weeks we will count more than footsteps. We will ask who could use the building, who still could not, and what people did with the extra time. A busy room is not automatically an accessible room. If Thursday evenings help, we will seek funding for more. If they do not, we will change them.

Libraries are sometimes described as warehouses for books. Ours is not a warehouse. It is a public kitchen without a menu, an indoor square protected from rain, a power socket beside someone who knows how to read an official letter, a children's room where a tired adult can finish one whole story.

Late opening begins this month.

THE DOORS ARE ALREADY YOURS.

East Gate Library · 14 Market Lane · Buses 2, 7 and 11 · eastgatelibrary.example/evening
This campaign was written with the Thursday Evening Advisory Group and is available in large print and audio on request.`,
        prompt: "Analyse how the campaign combines language and structural choices to present the library as more than a place for borrowing books.",
      },
      {
        label: "Text 2 — student editorial",
        text: `THE BENCH WAS NOT THE PROBLEM
An editorial from The North Corridor, the student newspaper

Our school has installed six new clocks, each accurate to the second. One faces the entrance, two supervise the cafeteria and three hang along the renovated science corridor. Their hands move together with military confidence. Yet the five minutes between lessons feel less manageable than ever.

The renovation removed the old bench outside Laboratory 3. The bench was scratched, uneven and frequently occupied by somebody's bag. It was also the place where students tied a shoelace, waited for a teacher, finished an argument, or noticed that a friend did not want to enter the next lesson. In its place there is now a white wall and a sign: KEEP MOVING.

The sign may have begun as practical advice. At 10:25 the corridor is undeniably crowded. Students turning toward the stairs meet classes leaving science, and a bench cannot create extra width. But instructions do more than control traffic. They reveal what a place believes people are for. KEEP MOVING turns every student into an item being delivered. A good student arrives. A late student obstructs. A stationary student has become a fault in the system.

The school's own explanation praises the corridor as “efficient, visible and easy to supervise.” Efficient for what? Visible to whom? The display cases contain photographs of experiments, but the corridor itself allows no experiment in how we might share space. Every surface is wipe-clean. Every chair has been moved inside a room that requires permission to enter. The only approved activity between bells is travel.

We understand the obvious objection: put the bench back and a group will gather around it. The route will narrow. Someone will leave a bottle underneath. These are management problems, not arguments against a place to pause. Paint a waiting zone beside the wall. Use two short seats rather than one long bench. Ask the students who use the corridor to test positions for a week. The solution does not need to be nostalgic; nobody is demanding the return of the bench's loose metal leg.

There is also a less obvious objection. Some adults fear that providing somewhere to stop encourages students to be late. This confuses cause and effect. A student who intends to avoid class does not require school furniture. Meanwhile, a student who is dizzy, overwhelmed or simply early deserves an option other than standing in the flow or hiding in a bathroom. Punctuality should measure whether learning begins well, not whether every body is in motion until the bell.

Consider what happened last Tuesday. A Year 11 student dropped a folder near the absent bench. Sheets spread across the floor. The students behind him did exactly what the architecture requested: they kept moving, stepping around the paper because stopping would block the route. Nobody behaved cruelly. The corridor had trained them to treat help as congestion.

We can build a different instruction into the same space. Put back a place to pause. Angle it away from the narrowest point. Add a small shelf for bags. Let the student council monitor the trial and publish the results. If the corridor becomes unsafe, move the seat. That is what responsible experimentation looks like.

Keep the clocks. Accuracy is useful. But time at school is not only the number of seconds required to travel from mathematics to chemistry. Sometimes five minutes must contain an apology, a question, a breath, or the sentence “Are you all right?”

Let a corridor remain a route. Let it also become a place where one person can notice another.`,
        prompt: "Analyse how the writer uses voice and contrast to argue for a change in the school environment.",
      },
    ],
    comparativePrompts: [
      "Compare how two studied works use setting to expose a conflict between private needs and public expectations.",
      "Compare the ways in which two studied works make silence meaningful.",
      "Compare how changes in power are represented through relationships in two studied works.",
      "Compare how two studied works encourage the audience to question apparently ordinary routines.",
    ],
  },
  {
    subject: "english-a-literature",
    label: "English A: Literature",
    validatedFullFormat: true,
    instructionsOne: "Choose one original literary text and write a close analysis of the ways in which its literary features create meaning. Enter the response beside the chosen text; no separate answer sheet is used.",
    instructionsTwo: "Choose one prompt and compare two literary works studied in class. Enter the complete essay in DigitalDP; no separate answer sheet is used.",
    sources: [
      {
        label: "Text 1 — prose extract, The Tide Clock",
        text: `From THE TIDE CLOCK

Mara wound the clock every morning although it had not kept time since the winter storm. Its hands remained at eleven minutes past four, the hour the sea climbed the harbour steps and entered the shop without knocking.

The winding key lived in the blue saucer beneath the till. She turned it seven times, stopping before the spring tightened, and listened to the small dry complaint inside the case. No ticking followed. Customers assumed the clock was an heirloom. Mara let them. It was easier than explaining that she had bought it from a hotel clearance sale fourteen months before the flood, because its face was the same green as deep water.

“Victorian?” visitors sometimes asked.

“Earlier than it looks,” Mara would say, which satisfied everybody.

She polished its cracked glass while they described the storm as unusual, historic, impossible. Those were the words used by people whose shoes had stayed dry. Behind the counter, a pale line crossed the wall above her shoulder. She never pointed to it. The new paint covered the stain but not the change in texture, and on bright afternoons salt crystals lifted through the white surface like a message refusing to remain buried.

Before the storm, the shop sold maps. Not useful maps of bus routes or footpaths, but handsome maps printed before the sea wall, when the marsh was drawn as empty green and the harbour ended exactly where the cartographer wished. Holidaymakers bought them rolled in tissue. Mara liked the faith of those clean borders. Water here. Land there. A dark line between.

Afterward, the damaged maps dried into waves. She placed them under heavy books, but coastlines had buckled and roads met themselves at strange angles. The council offered a recovery grant for ruined stock if she submitted photographs. Mara photographed shelves, boxes and the brown fan of water beneath the door. She did not photograph the maps. Instead she hung the least damaged ones from string in the upstairs room and waited for gravity to remember what flatness was.

In February, a man from the insurance company asked why the clock had not been included in her claim.

“It still tells me what I need,” she said.

He wrote “sentimental value only” on his form.

The harbour reopened in March. Fresh boards covered the broken sections of the sea wall, conspicuously pale among the old timber. Shops placed buckets of daffodils outside their doors. The bakery produced buns iced with blue waves until somebody complained. Visitors returned and photographed the brass marker showing the height of the water. They stood below it smiling, one hand raised to indicate scale.

Mara developed a habit of watching their wrists. Watches continued around the marker. Eleven ten. Eleven eleven. Eleven twelve. The world moved through the stopped minute without resistance.

On the first warm day of spring, a boy came in alone. He wore a school jumper with both cuffs unraveling and spent twenty minutes turning the rack of postcards without choosing one. Mara knew he was waiting for somebody because every time the door opened his shoulders rose.

At last he approached the counter and looked not at her but at the clock.

“Why is it broken?”

“It isn't,” Mara said.

The boy examined the silent pendulum. “The hands don't move.”

“Some clocks keep an hour instead of losing it.”

He considered this with an attention adults rarely gave her. Outside, a delivery van struck the loose drain cover, making a sound like a dropped tray.

“Was it a good hour?” he asked.

Mara's fingers found the winding key in the saucer.

The truthful answer arrived first: cold water around her knees, a cabinet tipping forward, glass jars knocking together in the dark. Then came another memory, one she had not invited: three neighbours linking arms across the doorway, passing boxes upward; somebody laughing because all the umbrellas had floated to the ceiling; the baker wrapping Mara in a flour-dusted coat.

“It was an hour,” she said.

The door opened. A woman entered, breathless, and the boy's shoulders fell. While apologies filled the shop, Mara lifted the clock down from its hook. Salt had furred the back of the case. Beneath it, hidden for months, the wall was clean.

She did not move the hands. Not yet. But that evening, instead of returning the clock to the nail, she set it on the worktable beside the upstairs maps, where the paper coastlines were slowly becoming still.`,
        prompt: "Analyse how the passage uses the clock and the shop setting to reveal Mara’s relationship with the past.",
      },
      {
        label: "Text 2 — poem, Borrowed Light",
        text: `BORROWED LIGHT

At dawn the windows lend us gold,
not asking what we did with night.
The cups stand patient in a row,
small moons with handles, holding light.

The table keeps its older scars:
a compass-point, a candle's shore,
the pale square where a photograph
protected what it covered for.

You enter carrying yesterday
folded small inside your coat.
The kettle rehearses weather;
steam edits the sentence in your throat.

We do not name the empty chair.
We move the sugar bowl instead.
Outside, the roofs begin to burn.
Inside, you butter both sides of bread.

By noon the gift has crossed the floor;
our shadows occupy the chairs.
We speak as if the day were ours,
then leave our fingerprints on air.

A delivery bicycle rings below.
The lift complains, then climbs, then stops.
The building practises being alive:
keys, pipes, footsteps, sudden drops.

You hold a cup against your cheek
as though warmth could be overheard.
I ask about the train at three.
You answer with a smaller word.

Soon sunlight reaches the clock's brass rim
and makes each minute briefly bright.
We have mistaken being seen
for being understood by light.

At four the neighbouring tower throws
our borrowed window back at us:
two figures caught in distant glass,
reduced to shape, anonymous.

At dusk the windows take it back.
The room grows honest, blue and slight.
We wash the cups. We close the blinds.
No surface now pretends to write.

Yet on the table, cooling rings
remain where both our hands had been—
small proofs that what the light revealed
was neither borrowed nor unseen.

Tomorrow's windows may lend gold.
Tomorrow may revise the night.
We leave one curtain open still,
not owed, not owned: a square of light.`,
        prompt: "Analyse how imagery and shifts across the day develop the poem’s treatment of time and possession.",
      },
    ],
    comparativePrompts: [
      "Compare how two studied works turn memory into a source of both comfort and conflict.",
      "Compare the effects of narrative or dramatic perspective in shaping sympathy in two studied works.",
      "Compare how images of home are complicated in two studied works.",
      "Compare how two studied works use moments of recognition to alter the audience’s understanding of a character.",
    ],
  },
  {
    subject: "korean-a-language-literature",
    label: "Korean A: Language and Literature",
    instructionsOne: "두 개의 창작 텍스트 중 하나를 선택하여 언어, 구성, 어조가 독자에게 미치는 효과를 분석하십시오. 답안은 선택한 문항의 입력란에 작성하며 별도의 답안지는 필요하지 않습니다.",
    instructionsTwo: "문제 하나를 선택하여 수업에서 공부한 두 작품을 비교하는 논술을 작성하십시오. 별도의 답안지는 필요하지 않습니다.",
    promptLabel: "문제",
    responseSuffix: "답안",
    sources: [
      {
        label: "텍스트 1 — 공공 도서관 안내문",
        text: "오늘의 빈 의자를 빌려드립니다. 해오름도서관은 매주 수요일 밤 10시까지 문을 엽니다. 책을 꼭 빌리지 않아도 됩니다. 조용히 과제를 마치고 싶은 학생, 퇴근 뒤 잠시 숨을 고르고 싶은 이웃, 아이와 함께 한 페이지를 읽고 싶은 가족 모두를 기다립니다. 회원증이 없어도 안내 데스크에서 바로 만들 수 있습니다. 도서관은 책이 있는 건물만이 아니라, 누구도 소비자가 되지 않아도 머물 수 있는 시간입니다.",
        prompt: "이 안내문이 도서관을 새로운 방식으로 인식하게 하기 위해 사용하는 언어와 구성 방식을 분석하십시오.",
      },
      {
        label: "텍스트 2 — 학생 칼럼",
        text: "학교는 휴대전화를 내려놓으면 대화가 돌아올 것이라고 말한다. 그러나 점심시간에 우리가 바라보는 것은 화면만이 아니다. 너무 큰 식당, 너무 짧은 시간, 항상 같은 친구와 앉아야 한다는 보이지 않는 규칙도 있다. 금지 표지판 하나로 고립이 사라지지는 않는다. 휴대전화를 치우기 전에, 혼자 온 학생도 자연스럽게 들어갈 수 있는 작은 테이블과 조용한 공간부터 만들자. 대화는 명령으로 시작되지 않는다. 자리가 생길 때 시작된다.",
        prompt: "필자가 학교의 휴대전화 정책을 재구성하기 위해 대비와 설득적 어조를 어떻게 사용하는지 분석하십시오.",
      },
    ],
    comparativePrompts: [
      "두 작품에서 개인의 욕망과 사회적 기대가 충돌하는 방식을 비교하십시오.",
      "두 작품에서 침묵이 의미를 만들어 내는 방식을 비교하십시오.",
      "두 작품에서 공간이 권력관계를 드러내는 방식을 비교하십시오.",
      "두 작품이 일상적인 행동을 낯설게 보이게 하는 방식을 비교하십시오.",
    ],
  },
  {
    subject: "korean-a-literature",
    label: "Korean A: Literature",
    instructionsOne: "두 개의 창작 문학 텍스트 중 하나를 선택하여 문학적 특징이 의미를 형성하는 방식을 분석하십시오. 별도의 답안지는 필요하지 않습니다.",
    instructionsTwo: "문제 하나를 선택하여 수업에서 공부한 두 문학 작품을 비교하십시오. 별도의 답안지는 필요하지 않습니다.",
    promptLabel: "문제",
    responseSuffix: "답안",
    sources: [
      {
        label: "텍스트 1 — 단편소설 발췌, 막차",
        text: "막차가 떠난 뒤에도 정류장의 전광판은 삼 분 후 도착이라고 빛났다. 수진은 오류라는 것을 알면서도 숫자가 줄어드는 모습을 지켜보았다. 이 분, 일 분, 곧 도착. 길 건너 편의점 직원이 의자를 접고 있었고, 어머니에게서 세 번째 전화가 왔다. 수진은 받지 않았다. 화면이 다시 삼 분으로 돌아갔을 때, 그녀는 이상하게 안심했다. 기다림이 끝나지 않는다면 늦었다는 사실도 아직 확정되지 않은 것 같았다.",
        prompt: "시간과 반복의 표현이 수진의 심리와 선택을 어떻게 드러내는지 분석하십시오.",
      },
      {
        label: "텍스트 2 — 시, 창문 연습",
        text: "아침마다 창문은\n바깥을 한 장씩 넘긴다\n어제의 비는 여백에 남고\n버스는 밑줄처럼 지나간다\n\n나는 유리에 손을 대어\n차가운 문장을 읽는다\n열지 못한 채로도\n세상은 계속 다음 장이다",
        prompt: "비유와 행 구성이 화자의 거리감과 변화에 대한 태도를 어떻게 형성하는지 분석하십시오.",
      },
    ],
    comparativePrompts: [
      "두 작품에서 기억이 위안과 갈등의 원천이 되는 방식을 비교하십시오.",
      "두 작품에서 서술 관점이 독자의 공감을 형성하는 방식을 비교하십시오.",
      "두 작품에서 집 또는 고향의 이미지가 복잡해지는 방식을 비교하십시오.",
      "두 작품에서 깨달음의 순간이 인물에 대한 이해를 바꾸는 방식을 비교하십시오.",
    ],
  },
  {
    subject: "japanese-a-language-literature",
    label: "Japanese A: Language and Literature",
    instructionsOne: "二つの創作テクストから一つを選び、言葉、構成、語り口が読み手に与える効果を分析しなさい。解答は各設問の入力欄に記入し、別紙は使用しません。",
    instructionsTwo: "一つの設問を選び、授業で学んだ二作品を比較する論考を書きなさい。別紙は使用しません。",
    promptLabel: "設問",
    responseSuffix: "解答",
    sources: [
      {
        label: "テクスト1 — 移動図書館の案内",
        text: "本棚が、あなたの町まで走ります。青葉市の移動図書館『ページ号』は、今月から駅前だけでなく、海辺の団地と北山公園にも停車します。本を返すだけでも、車内で十分休むだけでもかまいません。初めての方には職員が三分で利用方法を案内します。図書館は遠い建物ではありません。水曜日の午後、青いバスが角を曲がってきたら、そこが今日の図書館です。",
        prompt: "この案内が図書館への距離感を変えるために用いる表現と構成を分析しなさい。",
      },
      {
        label: "テクスト2 — 生徒新聞の投書",
        text: "新しい食堂には百二十席ある。しかし、一人で座りやすい席は一つもない。学校は『交流のため』に長いテーブルを選んだという。けれども、交流は同じ形の椅子を並べれば生まれるものだろうか。窓際に小さな机を置き、静かに食べたい人にも場所をつくってほしい。みんなで食べる自由には、一人で食べる自由も含まれるはずだ。",
        prompt: "筆者が学校の空間設計を批判するために、対比と問いかけをどのように使っているか分析しなさい。",
      },
    ],
    comparativePrompts: [
      "二作品において、個人の願いと社会の期待が衝突する様子を比較しなさい。",
      "二作品において、沈黙が意味を生み出す方法を比較しなさい。",
      "二作品において、空間が権力関係を表す方法を比較しなさい。",
      "二作品が日常的な習慣を問い直させる方法を比較しなさい。",
    ],
  },
  {
    subject: "japanese-a-literature",
    label: "Japanese A: Literature",
    instructionsOne: "二つの創作文学テクストから一つを選び、文学的特徴が意味を形づくる方法を分析しなさい。別紙は使用しません。",
    instructionsTwo: "一つの設問を選び、授業で学んだ二つの文学作品を比較しなさい。別紙は使用しません。",
    promptLabel: "設問",
    responseSuffix: "解答",
    sources: [
      {
        label: "テクスト1 — 短編小説『乾燥機』より",
        text: "乾燥機は残り七分を表示したまま、同じ低い音を繰り返していた。美紀は丸い窓の向こうで父のシャツが現れては消えるのを見ていた。ポケットを確かめたはずなのに、小さな紙片が布の間を舞っている。取り出すには止めなければならない。止めれば、何が書かれているのか確かめたくなる。店の時計が午前一時を打った。美紀は椅子に座り直し、七分が永遠であることを願った。",
        prompt: "反復と限定された空間が、美紀の葛藤をどのように表しているか分析しなさい。",
      },
      {
        label: "テクスト2 — 詩『雨の余白』",
        text: "雨は町の文字を薄くする\n看板も約束もにじませて\n傘の下だけが小さな本文\n\n信号が青に変わるたび\n私たちは一行ずつ進む\n読み終えないままの午後を\n靴の裏に折りたたんで",
        prompt: "文字と読書のイメージが、都市での移動と不確かさをどのように表すか分析しなさい。",
      },
    ],
    comparativePrompts: [
      "二作品において、記憶が慰めと葛藤の両方を生む方法を比較しなさい。",
      "二作品において、語りの視点が読者の共感を導く方法を比較しなさい。",
      "二作品において、家のイメージが複雑になる方法を比較しなさい。",
      "二作品において、認識の瞬間が人物理解を変える方法を比較しなさい。",
    ],
  },
  {
    subject: "spanish-a-language-literature",
    label: "Spanish A: Language and Literature",
    instructionsOne: "Elige uno de los dos textos originales y analiza cómo el lenguaje, la estructura y el tono construyen significado para su público. Escribe en el espacio de la pregunta; no se utiliza una hoja de respuestas aparte.",
    instructionsTwo: "Elige una pregunta y compara dos obras estudiadas en clase. Escribe el ensayo completo en DigitalDP; no se utiliza una hoja aparte.",
    promptLabel: "Pregunta",
    responseSuffix: "respuesta",
    sources: [
      {
        label: "Texto 1 — campaña de biblioteca nocturna",
        text: "TE PRESTAMOS LA NOCHE. La Biblioteca del Puente abrirá hasta las diez todos los jueves. No hace falta venir con una lista de libros. Puedes traer una tarea a medio terminar, una novela abandonada o una hora sin planes. A las siete habrá una visita rápida para quienes nunca han entrado. A las ocho bajaremos las luces de la sala infantil para leer en familia. ¿No tienes carnet? Lo preparamos mientras se calienta el agua. Una ciudad también necesita lugares donde quedarse sin comprar nada.",
        prompt: "Analiza cómo la campaña emplea el lenguaje y la organización del texto para presentar la biblioteca como algo más que un servicio de préstamo.",
      },
      {
        label: "Texto 2 — columna estudiantil",
        text: "El nuevo patio tiene más cámaras que bancos. La dirección afirma que las cámaras nos protegen y que los bancos dificultan la circulación. Tal vez ambas cosas sean ciertas, pero el resultado también comunica una prioridad: aquí es más importante vigilar el movimiento que permitir una pausa. Recuperemos al menos los dos bancos retirados junto al gimnasio. Un lugar seguro no es solamente aquel donde se registra todo; también es aquel donde alguien puede sentarse y ser visto por un amigo.",
        prompt: "Analiza cómo la autora utiliza el contraste y la reformulación de la idea de seguridad para defender su propuesta.",
      },
    ],
    comparativePrompts: [
      "Compara cómo dos obras estudiadas representan el conflicto entre los deseos privados y las expectativas públicas.",
      "Compara las maneras en que el silencio adquiere significado en dos obras estudiadas.",
      "Compara cómo los espacios revelan relaciones de poder en dos obras estudiadas.",
      "Compara cómo dos obras convierten una rutina cotidiana en motivo de cuestionamiento.",
    ],
  },
  {
    subject: "spanish-a-literature",
    label: "Spanish A: Literature",
    instructionsOne: "Elige uno de los dos textos literarios originales y analiza cómo sus rasgos literarios construyen significado. Escribe en el espacio correspondiente; no se utiliza una hoja aparte.",
    instructionsTwo: "Elige una pregunta y compara dos obras literarias estudiadas en clase. No se utiliza una hoja de respuestas aparte.",
    promptLabel: "Pregunta",
    responseSuffix: "respuesta",
    sources: [
      {
        label: "Texto 1 — fragmento de El último autobús",
        text: "Aunque el último autobús ya había salido, la pantalla de la parada insistía: llegada en tres minutos. Inés conocía el error, pero observó cómo bajaban los números. Dos. Uno. Próximo. Al otro lado de la calle, el dependiente apagó la luz del quiosco y su madre llamó por tercera vez. Inés no contestó. Cuando la pantalla volvió a marcar tres minutos, sintió alivio. Mientras la espera no terminara, quizá tampoco quedaba confirmado que había llegado demasiado tarde.",
        prompt: "Analiza cómo el tiempo y la repetición revelan el conflicto interior de Inés.",
      },
      {
        label: "Texto 2 — poema, Mapa de bolsillo",
        text: "Doblo la ciudad en cuatro\npara guardarla junto a las llaves.\nLa avenida pierde su ruido,\nel río cabe bajo mi nombre.\n\nPero al abrirla de nuevo\nlas esquinas ya no coinciden:\nhay una calle que no recuerdo\ny una casa que me recuerda a mí.",
        prompt: "Analiza cómo las imágenes del mapa y los cambios de escala desarrollan la relación entre memoria e identidad.",
      },
    ],
    comparativePrompts: [
      "Compara cómo la memoria se convierte en fuente de consuelo y de conflicto en dos obras estudiadas.",
      "Compara cómo la perspectiva narrativa o dramática orienta la empatía en dos obras estudiadas.",
      "Compara cómo se complica la imagen del hogar en dos obras estudiadas.",
      "Compara cómo un momento de reconocimiento transforma la comprensión de un personaje en dos obras estudiadas.",
    ],
  },
];

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

const languageBConfigs: LanguageBConfig[] = [
  {
    subject: "spanish-b",
    label: "Spanish B",
    writingInstructions: "Elige una tarea. Utiliza un tipo de texto adecuado y escribe entre 250 y 400 palabras. Responde en DigitalDP; no se utiliza una hoja aparte.",
    readingInstructions: "Lee los tres textos originales y responde todas las preguntas en sus espacios vinculados. No se utiliza una hoja de respuestas aparte.",
    taskLabel: "Tarea",
    writingTasks: [
      "Tu ciudad quiere sustituir un pequeño parque público por un aparcamiento. Escribe una carta al ayuntamiento explicando tu postura y proponiendo una alternativa práctica.",
      "Has pasado una semana sin utilizar aplicaciones de entrega de comida. Escribe una entrada de blog para otros estudiantes describiendo la experiencia y evaluando si continuarás.",
      "Tu colegio quiere recibir mejor al alumnado nuevo. Escribe unas pautas para mentores estudiantiles y explica qué deben hacer durante el primer mes.",
    ],
    readingTexts: [
      { label: "Texto A — biblioteca de herramientas", text: "En la Biblioteca de Herramientas del Mercado Oeste, los socios toman prestados taladros, máquinas de coser y hornillos en vez de comprar objetos que quizá usarían una sola vez. La cuota anual es pequeña, pero cada socio aporta también una hora de trabajo. Algunas personas reparan herramientas; otras fotografían el material o traducen las tarjetas de seguridad. Según la coordinadora, la colaboración importa más que el dinero: quien llega buscando un objeto suele encontrar también a alguien que sabe utilizarlo." },
      { label: "Texto B — vagón tranquilo", text: "Una empresa ferroviaria ha creado un vagón tranquilo en los servicios nocturnos. Se desaconsejan las llamadas y se reducen los anuncios, aunque conversar no está prohibido. Durante el primer mes bajaron las quejas generales, pero surgieron otras sobre pasajeros que corregían de forma agresiva a los demás. La empresa cambió el cartel SILENCIO por el mensaje COMPARTAMOS LA CALMA y formará al personal para resolver desacuerdos sin convertir el vagón en un espacio de vigilancia." },
      { label: "Texto C — huerto en la azotea", text: "Cuando Ada plantó tomates en la azotea de su edificio, esperaba verduras, no reuniones. Pronto aparecieron notas junto al depósito de agua: ¿podemos cultivar hierbas?, ¿pueden subir los niños? Un año después, doce familias compartían el trabajo. La cosecha sigue siendo pequeña y nadie ahorra mucho dinero. El cambio más importante ocurre abajo: vecinos que antes guardaban silencio en el ascensor ahora comparan el tiempo e intercambian recetas. ‘El huerto no nos hizo autosuficientes’, dice Ada. ‘Nos hizo visibles’." },
    ],
    readingQuestions: [
      choiceQuestion("q1", "Texto A · Pregunta 1", "¿Qué aporta cada socio además de la cuota?", ["Una hora de trabajo", "Una máquina", "Un certificado", "Un taller completo"], 2, ["text-1"]),
      shortQuestion("q2", "Texto A · Pregunta 2", "Indica dos maneras en que los socios colaboran con la biblioteca.", 3, ["text-1"]),
      choiceQuestion("q3", "Texto B · Pregunta 3", "¿Por qué se cambió el cartel original?", ["Era demasiado caro", "Favorecía una vigilancia rígida", "No se podía traducir", "Reducía la venta de billetes"], 2, ["text-2"]),
      shortQuestion("q4", "Texto B · Pregunta 4", "Explica una tensión creada por el vagón tranquilo.", 3, ["text-2"]),
      choiceQuestion("q5", "Texto C · Pregunta 5", "¿Qué resultado sorprendió más a Ada?", ["El tamaño de los tomates", "El ahorro económico", "Las nuevas relaciones vecinales", "El número de azoteas"], 2, ["text-3"]),
      shortQuestion("q6", "Texto C · Pregunta 6", "Explica qué significa que el huerto hizo ‘visibles’ a los vecinos.", 3, ["text-3"]),
      shortQuestion("q7", "Todos los textos · Pregunta 7", "Identifica una idea común en los textos A y C y apóyala con un detalle de cada uno.", 3, ["text-1", "text-3"]),
      shortQuestion("q8", "Todos los textos · Pregunta 8", "¿Qué iniciativa puede producir un cambio comunitario más duradero? Justifica tu opinión con un texto.", 2, ["text-1", "text-2", "text-3"]),
    ],
  },
];

export const LANGUAGE_SAMPLE_PAPERS = [
  ...languageAConfigs.flatMap(languageASamples),
  ...ENGLISH_B_PAPERS,
  ...languageBConfigs.flatMap(languageBSamples),
];
