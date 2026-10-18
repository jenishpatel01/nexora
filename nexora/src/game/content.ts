import type { PickOption, PickRound, QuizRound } from './types'

const q = (prompt: string, options: string[], answer: number, why: string, extra: Partial<QuizRound> = {}): QuizRound => ({
  kind: 'quiz', prompt, options, answer, why, time: 20, ...extra,
})

/* ---------------------------------- Coding --------------------------------- */
export const codingBank: QuizRound[] = [
  q('What does this print?', ['null', 'object', 'undefined', 'number'], 1, 'A famous JavaScript quirk: typeof null returns "object".', { code: 'console.log(typeof null)' }),
  q('Which line has the bug?', ['function sum(arr)', 'let total = 0', 'i <= arr.length', 'return total'], 2, '<= walks one step past the end. arr[arr.length] is undefined, so total turns into NaN.', {
    code: 'function sum(arr) {\n  let total = 0\n  for (let i = 0; i <= arr.length; i++) {\n    total += arr[i]\n  }\n  return total\n}',
  }),
  q('What is the time complexity of this search?', ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], 1, 'Each loop halves the remaining range, so the work grows with log n.', {
    code: 'while (low <= high) {\n  mid = (low + high) / 2\n  if (data[mid] === target) return mid\n  if (data[mid] < target) low = mid + 1\n  else high = mid - 1\n}',
  }),
  q('What does this print?', ['true', 'false', 'undefined', 'It throws an error'], 1, 'Floating point math: 0.1 + 0.2 is 0.30000000000000004.', { code: 'console.log(0.1 + 0.2 === 0.3)' }),
  q('What does this print?', ['[1, 9, 10]', '[1, 10, 9]', '[10, 9, 1]', '[9, 10, 1]'], 1, 'sort() with no comparator compares values as strings, so "10" comes before "9".', { code: 'console.log([10, 9, 1].sort())' }),
  q('Which data structure is last in, first out?', ['Queue', 'Stack', 'Heap', 'Graph'], 1, 'A stack hands back the most recently added item first.'),
  q('What is wrong with this check?', ['= assigns instead of comparing', 'age is a reserved word', 'allow() needs await', 'It needs a semicolon'], 0, 'A single = assigns 18 to user.age. Use === to compare.', { code: 'if (user.age = 18) {\n  allow()\n}' }),
  q('What is the time complexity of this code?', ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], 2, 'A loop inside a loop over the same list does n × n comparisons.', {
    code: 'for (const a of items) {\n  for (const b of items) {\n    compare(a, b)\n  }\n}',
  }),
  q('You must check "have I seen this id?" thousands of times. Best fit?', ['Array.includes', 'A Set', 'Sort every time', 'A nested loop'], 1, 'A Set answers membership checks in roughly constant time.'),
  q('What happens when you call countdown(3)?', ['Prints 3 2 1 and stops', 'Prints 3 2 1 0 and stops', 'Runs until the stack overflows', 'Returns undefined at once'], 2, 'There is no base case, so it never stops calling itself.', {
    code: 'function countdown(n) {\n  console.log(n)\n  countdown(n - 1)\n}',
  }),
]

/* ---------------------------------- Debate --------------------------------- */
const o = (id: string, text: string, value: number, tag: string, note: string): PickOption => ({ id, text, value, tag, note })

const debate = (stage: string, motion: string, quote: string, opts: PickOption[]): PickRound => ({
  kind: 'pick', stage, context: motion, quote, prompt: 'Pick your reply', options: opts, time: 25,
})

export const debateBank: PickRound[] = [
  debate('', 'Cities should prioritize public space over cars.', 'Cars bring people and money into the city. Fewer cars means fewer customers.', [
    o('a', 'Studies of pedestrianized streets often show shops keep or grow sales, because people on foot visit more often.', 9, 'Evidence', 'Specific, checkable, and it answers the claim directly.'),
    o('b', 'Cars are basically evil and everyone knows it.', 2, 'Overclaim', 'Sweeping and unsupported. Judges punish this.'),
    o('c', 'You obviously never walk anywhere, so you would not understand.', 1, 'Personal attack', 'Attacking the speaker is not an argument.'),
    o('d', 'Parks are nicer than parking lots.', 5, 'Opinion', 'Pleasant, but it does not address the business claim.'),
  ]),
  debate('', 'Schools should start later in the morning.', 'Students will just stay up later, so nothing really changes.', [
    o('a', 'Trials that moved start times found students slept more overall, because bedtimes barely moved.', 9, 'Evidence', 'Directly answers the objection with a result.'),
    o('b', 'Sleep is important.', 4, 'Vague', 'True, but it does not rebut anything.'),
    o('c', 'That is what adults always say.', 3, 'Dismissal', 'Waving it away is not a counter.'),
    o('d', 'Even if some stay up later, a later start costs nothing extra and helps the ones who do not.', 7, 'Reasoned', 'A fair concession followed by a real point.'),
  ]),
  debate('', 'Remote work beats office work.', 'Teams cannot build trust through a screen.', [
    o('a', 'Many fully remote teams build trust through clear writing and reliable check-ins. Trust comes from reliability, not a shared room.', 9, 'Evidence', 'Reframes where trust comes from.'),
    o('b', 'Offices are outdated.', 3, 'Slogan', 'Confident, but empty.'),
    o('c', 'Trust is for people who cannot track hours.', 2, 'Non sequitur', 'This answers a different question.'),
    o('d', 'Some tasks need a room, but most cannot justify a daily commute.', 6, 'Balanced', 'Reasonable, though it concedes ground.'),
  ]),
  debate('', 'Homework should be optional.', 'Without homework, students will not practice.', [
    o('a', 'Practice matters, but research shows little gain from homework in primary school. Short, purposeful practice beats volume.', 8, 'Evidence', 'Accepts the goal, challenges the method.'),
    o('b', 'Kids have too much stress.', 4, 'Emotional', 'Sympathetic, but it skips the claim about practice.'),
    o('c', 'You cannot force anyone to learn.', 3, 'Slogan', 'Catchy, thin on substance.'),
    o('d', 'Homework is just busywork invented by teachers.', 1, 'Overclaim', 'A broad accusation with nothing behind it.'),
  ]),
  debate('', 'Every student should learn to code.', 'Most jobs do not need coding.', [
    o('a', 'Most jobs do not need calculus either, yet we teach it for the thinking skills. Coding trains logic and breaking problems down.', 8, 'Analogy', 'A strong parallel that flips the objection.'),
    o('b', 'Coding is the future, so obviously yes.', 3, 'Slogan', 'Assumes what it needs to prove.'),
    o('c', 'Anyone who disagrees is scared of computers.', 1, 'Personal attack', 'Guessing at motives loses the point.'),
    o('d', 'Teaching it early costs little and keeps options open.', 6, 'Reasoned', 'Practical, a bit light.'),
  ]),
  debate('', 'Social media should have a minimum age of 16.', 'Banning kids just pushes them to lie about their age.', [
    o('a', 'Enforcement is imperfect for many rules, like age limits on alcohol, but the rule still cuts use. Better age checks make it work better.', 9, 'Evidence', 'Concedes the flaw, shows why the rule still works.'),
    o('b', 'Parents just need to try harder.', 3, 'Deflection', 'Moves the burden without answering.'),
    o('c', 'Lying proves they are too young for it.', 2, 'Non sequitur', 'That does not follow.'),
    o('d', 'Then we should ban lying too.', 1, 'False fix', 'A joke, not an argument.'),
  ]),
  debate('', 'A four-day work week should be standard.', 'Companies will lose output.', [
    o('a', 'Trials at many companies reported steady output with fewer days, since focus rises and meetings shrink.', 9, 'Evidence', 'Answers with results, not feelings.'),
    o('b', 'Everyone deserves more free time.', 4, 'Emotional', 'Warm, but it ignores the output claim.'),
    o('c', 'Output is overrated.', 2, 'Dismissal', 'Brushes off the whole concern.'),
    o('d', 'It could start with knowledge jobs, and shift work can adapt later.', 7, 'Reasoned', 'Practical sequencing.'),
  ]),
  debate('', 'Public transport should be free.', 'Nothing is free. Someone pays.', [
    o('a', 'Right, taxpayers pay, but ticket collection often costs a lot to run, and free fares can reduce traffic and costs elsewhere.', 8, 'Reasoned', 'Agrees, then shifts the cost argument.'),
    o('b', 'The rich should pay for everything.', 2, 'Overclaim', 'Sweeping and off-topic.'),
    o('c', 'Buses are better than cars.', 3, 'Slogan', 'Not the point being argued.'),
    o('d', 'Cities that tried free fares saw ridership jump, which supports the idea.', 6, 'Evidence', 'Relevant, but ridership is not the cost question.'),
  ]),
]

/* ---------------------------------- Roast ---------------------------------- */
const roast = (quote: string, a: string, b: string, c: string, d: string): PickRound => ({
  kind: 'pick', context: 'Friendly roast battle', quote, prompt: 'Fire back', time: 20,
  options: [
    o('a', a, 9, 'Mic drop', 'Quick turn, lands on their own line.'),
    o('b', b, 6, 'Solid', 'Fine, but it leaves a gap.'),
    o('c', c, 3, 'Flat', 'The crowd waits for the joke. There is none.'),
    o('d', d, 1, 'Off target', 'Crickets.'),
  ],
})

export const roastBank: PickRound[] = [
  roast('Your typing is so slow, your keyboard filed for overtime.', 'At least my keyboard gets paid. Your jokes work for exposure.', 'Slow and accurate beats your fast and wrong.', 'Ha ha, very funny.', 'No u.'),
  roast('You cook like the smoke alarm is your sous chef.', 'The alarm sings, the neighbors applaud. It is dinner and a show.', 'At least my kitchen has some excitement. Yours has instructions.', 'I order takeout anyway.', 'You are not even funny.'),
  roast('Your WiFi has more confidence than you do, and it drops out too.', 'We both buffer, but I come back with a better punchline.', 'My WiFi is fine. Your comebacks are the ones still loading.', 'It is the router.', 'Whatever.'),
  roast('You are so late, your alarm clock sends you a "we need to talk" text.', 'I am not late. I am building suspense for my entrance.', 'At least my alarm still talks to me. Yours left.', 'Traffic was bad.', 'Stop talking.'),
  roast('Your handwriting is why doctors have a bad reputation.', 'Doctors say they cannot read it either, and they have seen ancient scrolls.', 'I write fast so I can finish before your joke does.', 'I use a computer.', 'That is so mean.'),
  roast('You have been "about to start" that project for three years.', 'Great things take time. Your jokes took three years and are still not done.', 'I am waiting for you to finish your joke first.', 'I have been busy.', 'Nobody asked you.'),
  roast('Your playlist is so basic, even the shuffle button gave up.', 'Shuffle quit your playlist and joined mine. It said the bar was low.', 'My playlist has range. Yours has one song on repeat.', 'Music is subjective.', 'That is rude.'),
  roast('You give advice like a GPS that only says "recalculating".', 'At least my GPS recalculates. Your jokes keep taking the same wrong exit.', 'I always get there eventually.', 'Okay.', 'You are wrong.'),
]

/* --------------------------------- Business -------------------------------- */
const biz = (stage: string, context: string, opts: [string, number, number, string][]): PickRound => ({
  kind: 'pick', stage, context, prompt: 'Make the call', time: 25,
  options: opts.map(([text, share, trust, note], i) => ({
    id: String.fromCharCode(97 + i), text, share, trust, note,
    value: Math.max(0, Math.min(10, Math.round(5 + share * 1.4 + trust))),
    tag: share >= 0 ? `+${share.toFixed(1)}% share` : `${share.toFixed(1)}% share`,
  })),
})

export const businessBank: PickRound[] = [
  biz('Launch', 'A rival cuts prices by 20%. How do you respond?', [
    ['Launch a premium bundle', 2.6, 2, 'Compete on value, not price.'],
    ['Match the price', 0.8, -1, 'You win customers but burn margin.'],
    ['Open in a new city', 1.8, 1, 'Avoids the price fight.'],
    ['Cut staff to save money', -0.8, -3, 'Savings now, quality problems later.'],
  ]),
  biz('Growth', 'Demand doubled overnight but you cannot ship fast enough.', [
    ['Pause ads and fix shipping first', 1.2, 3, 'Protects trust while you catch up.'],
    ['Keep selling and promise delays', 2.2, -3, 'Short-term share, long-term anger.'],
    ['Hire fast without training', 1.4, -1, 'Capacity without quality.'],
    ['Raise prices sharply', 0.4, -2, 'Cools demand, annoys customers.'],
  ]),
  biz('Crisis', 'A product flaw goes viral.', [
    ['Fix it, offer a free upgrade, publish a postmortem', 0.5, 5, 'Turns a crisis into proof you can be trusted.'],
    ['Recall and apologize', -1.5, 4, 'Costly but honest.'],
    ['Say it is rare', 0.5, -4, 'Customers do not believe you.'],
    ['Fix quietly and say nothing', 0, -5, 'It comes out later. It always does.'],
  ]),
  biz('Takeover', 'A giant offers to buy you at a fair price.', [
    ['Negotiate a partnership instead', 2, 2, 'Keeps your independence and their reach.'],
    ['Reject and double down on your niche', 1, 1, 'Bold, but risky.'],
    ['Sell right away', -3, 0, 'You leave value on the table.'],
    ['Ignore the email', 0, -1, 'Opportunities do not wait.'],
  ]),
  biz('Growth', 'Your first 1,000 customers are in. What next?', [
    ['Interview ten of them', 1, 2, 'Learn what they actually value.'],
    ['Buy a big ad slot', 0.4, -1, 'Awareness, but you learn nothing.'],
    ['Redesign the logo', 0, 0, 'Looks busy, changes nothing.'],
    ['Add twenty new features', -0.5, -1, 'Complexity without feedback.'],
  ]),
  biz('Growth', 'You are entering a country with different tastes.', [
    ['Pilot with a local partner', 1.6, 2, 'Learn fast with local knowledge.'],
    ['Copy your home strategy exactly', 0.2, -2, 'What worked at home may not travel.'],
    ['Hire a famous face', 1, 0, 'Attention, not understanding.'],
    ['Skip the market', 0, 0, 'Safe, but static.'],
  ]),
  biz('Crisis', 'Cash will run out in three months.', [
    ['Raise with real traction and an honest forecast', 1.4, 3, 'Investors reward clarity.'],
    ['Cut non-essential costs, keep the core team', 0.2, 1, 'Sensible, but it only buys time.'],
    ['Delay supplier payments', 0.4, -3, 'You burn goodwill with partners.'],
    ['Lay off half the team at once', -1, -3, 'Panic costs more than it saves.'],
  ]),
  biz('Takeover', 'A struggling rival is for sale.', [
    ['Acquire their best product and team', 3, 1, 'Capability, not just customers.'],
    ['Make a hostile bid funded by heavy debt', 4, -4, 'Big share, shaky foundations.'],
    ['Wait and watch', 0.2, 0, 'Cautious, but someone else buys.'],
    ['Copy their product', 0.6, -3, 'Cheap, and customers notice.'],
  ]),
]

/* -------------------------------- Knowledge -------------------------------- */
const k = (category: string, prompt: string, options: string[], answer: number, why: string): QuizRound =>
  q(prompt, options, answer, why, { category, time: 12 })

export const knowledgeBank: QuizRound[] = [
  k('Science', 'Which element has the atomic number 79?', ['Silver', 'Gold', 'Platinum', 'Copper'], 1, 'Gold, symbol Au, has atomic number 79.'),
  k('Science', 'Which gas do plants absorb for photosynthesis?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1, 'Plants take in carbon dioxide and release oxygen.'),
  k('Science', 'How many bones are in an adult human body?', ['156', '206', '256', '306'], 1, 'Adults have 206 bones.'),
  k('Science', 'What is the hardest natural substance?', ['Quartz', 'Diamond', 'Steel', 'Granite'], 1, 'Diamond is the hardest natural material.'),
  k('Science', 'Which planet is the largest in our solar system?', ['Saturn', 'Neptune', 'Jupiter', 'Earth'], 2, 'Jupiter is more than twice as massive as all other planets combined.'),
  k('History', 'In which year did World War II end?', ['1918', '1939', '1945', '1963'], 2, 'World War II ended in 1945.'),
  k('History', 'Who was the first person to walk on the Moon?', ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'Michael Collins'], 1, 'Neil Armstrong stepped onto the Moon in July 1969.'),
  k('History', 'Which ancient wonder in Egypt still stands today?', ['Colossus', 'Great Pyramid of Giza', 'Hanging Gardens', 'Lighthouse of Alexandria'], 1, 'The Great Pyramid of Giza is the only wonder still standing.'),
  k('History', 'The Renaissance began in which country?', ['France', 'Italy', 'Spain', 'England'], 1, 'The Renaissance began in Italy in the 14th century.'),
  k('History', 'Which civilization built Machu Picchu?', ['Aztec', 'Maya', 'Inca', 'Olmec'], 2, 'The Inca built Machu Picchu in the 15th century.'),
  k('Sports', 'How many players per side are on the field in a soccer match?', ['9', '10', '11', '12'], 2, 'Each team fields eleven players.'),
  k('Sports', 'Which country hosted the 2016 Summer Olympics?', ['China', 'Brazil', 'United Kingdom', 'Japan'], 1, 'Rio de Janeiro, Brazil, hosted the 2016 Games.'),
  k('Sports', 'In tennis, what is a score of 40-40 called?', ['Advantage', 'Deuce', 'Love', 'Break'], 1, 'At 40-40 the game is at deuce.'),
  k('Sports', 'How many rings are on the Olympic flag?', ['4', '5', '6', '7'], 1, 'Five rings, one for each inhabited continent group.'),
  k('Sports', 'How many balls are in a standard over in cricket?', ['4', '5', '6', '8'], 2, 'A standard over has six legal deliveries.'),
  k('General', 'What is the capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2, 'Canberra is the capital, not Sydney.'),
  k('General', 'Which language has the most native speakers?', ['English', 'Mandarin Chinese', 'Spanish', 'Hindi'], 1, 'Mandarin Chinese has the most native speakers.'),
  k('General', 'How many minutes are in a day?', ['1,200', '1,440', '1,640', '2,400'], 1, '24 hours × 60 minutes = 1,440.'),
  k('General', 'Which is the largest ocean?', ['Atlantic', 'Indian', 'Pacific', 'Arctic'], 2, 'The Pacific covers about a third of the planet.'),
  k('General', 'Which animal is the fastest on land?', ['Lion', 'Cheetah', 'Greyhound', 'Horse'], 1, 'Cheetahs reach about 100 km/h in short bursts.'),
  k('General', 'Who developed the theory of general relativity?', ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Galileo'], 2, 'Albert Einstein published general relativity in 1915.'),
]

/* ----------------------------------- Mind ---------------------------------- */
const m = (prompt: string, options: string[], answer: number, why: string): QuizRound => q(prompt, options, answer, why, { time: 15, category: 'Mind' })

export const patternBank: QuizRound[] = [
  m('2, 4, 8, 16, ?', ['18', '24', '32', '36'], 2, 'Each number doubles.'),
  m('1, 1, 2, 3, 5, ?', ['7', '8', '9', '10'], 1, 'Fibonacci: each number is the sum of the previous two.'),
  m('A, C, F, J, ?', ['N', 'O', 'P', 'M'], 1, 'The gaps grow by one each time: +2, +3, +4, +5.'),
  m('◆ ▲ ◆ ▲ ◆ ?', ['◆', '▲', '●', '■'], 1, 'The two shapes alternate.'),
  m('3, 6, 12, 24, ?', ['30', '36', '48', '52'], 2, 'Each number doubles.'),
  m('81, 27, 9, 3, ?', ['0', '1', '2', '6'], 1, 'Each number divides by three.'),
  m('Monday, Wednesday, Friday, ?', ['Saturday', 'Sunday', 'Monday', 'Thursday'], 1, 'Every other day.'),
]

export const logicBank: QuizRound[] = [
  m('All Bloops are Razzies. All Razzies are Lazzies. So all Bloops are…', ['Lazzies', 'Not Lazzies', 'Only some Lazzies', 'Cannot tell'], 0, 'The chain holds: Bloops → Razzies → Lazzies.'),
  m('If it rains, the match is cancelled. The match was NOT cancelled. What follows?', ['It rained', 'It did not rain', 'It might have rained', 'The match moved'], 1, 'If rain always cancels it, no cancellation means no rain.'),
  m('A bat and a ball cost $1.10. The bat costs $1 more than the ball. What does the ball cost?', ['10 cents', '5 cents', '1 cent', '15 cents'], 1, 'Ball 5¢ + bat $1.05 = $1.10, and the bat is exactly $1 more.'),
  m('Which number does not belong: 2, 3, 5, 9, 11?', ['2', '3', '9', '11'], 2, 'Every other number is prime. 9 = 3 × 3.'),
  m('Tom is taller than Sam. Sam is taller than Ria. Who is shortest?', ['Tom', 'Sam', 'Ria', 'Cannot tell'], 2, 'Tom > Sam > Ria.'),
]
