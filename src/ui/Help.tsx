// Quick reference built from the Bicknell setup book's terminology and tuning pages.

const TERMS: [string, string][] = [
  ['Left side %', '(LF + LR) / total. More left side steers better. BRP: 54.2-54.4% (p. 3).'],
  ['Rear %', '(LR + RR) / total. More is tighter on throttle; too much is "pendulum loose" on entry. Big block: 63.5-64.5% (p. 3).'],
  ['Cross / diagonal %', '(LR + RF) / total. Higher is tighter. Start at 46.5-47.5% (p. 3).'],
  ['Left rear weight (wedge)', 'LR minus RR. More tightens on throttle. Dry slick 60-110 lb, tacky 0-30 lb (p. 3, 8).'],
  ['Stagger', 'RR minus LR circumference. More frees up entry and the middle; too much slows the straights and loosens exit. 7-8 in heavy, 6-7 medium, 5-6 slick (p. 5, 8).'],
  ['Wheel lead', 'LR ahead of the RR shortens the left side wheelbase and frees the car up (p. 3, 8).'],
  ['Rake', 'Front vs rear ride height. Higher front = tighter entry; higher rear = looser exit (p. 4).'],
  ['Caster split', 'RF caster minus LF. Keep it 3-4 deg. Less split tightens entry (p. 4, 8).'],
  ['Roll steer', 'Rear radius rod angles steer the rear end as the car rolls. Raising the RR rod adds roll steer and frees the car up (p. 40).'],
  ['Side bite', 'Grip while the car slides across the track: panhard angle, ride height, ballast height, rear tire pressure (p. 5, 50).'],
  ['Forward bite', 'Grip accelerating off the corner: torque arm, spring rod, LR spring, shocks, tire prep (p. 5, 49).'],
  ['Compression / rebound', 'Compression controls how fast weight gets to a corner; rebound controls how long it stays. Shocks don\'t change mid-corner balance (p. 51).'],
  ['Nitrogen', '25 psi of shock gas is about 10 lb of spring. Stay within 50 psi of factory (p. 51).'],
  ['Bind', 'Anything that stops the suspension moving freely. It can make the driver report a problem you then tune for by mistake (p. 4, 39).'],
];

const HOW: string[] = [
  'Sandbox: change the car, pick a track and surface, run laps, and read the driver. The engineer view shows what the model thinks each phase is doing and why. Hide it to practise working from the driver and the stopwatch.',
  'Race night: hot laps, heat, consi if needed, feature. Each work window has a time limit and every change costs crew minutes. The track dries as the night goes.',
  'Drills: situations with graded answers and the manual page behind each. "Try it in the sandbox" loads the drill car and track so you can test any answer.',
  'Notebook: save setups that worked, compare any two, and export or import them as files.',
];

export function Help() {
  return (
    <div className="layout two">
      <section className="panel">
        <h2>How to use it</h2>
        {HOW.map((h) => <p key={h} className="help-p">{h}</p>)}
        <h3>How the adjustments work</h3>
        <p className="help-p">
          Adjustments are made the way they are on the car. <b>Turns</b> are stepped: one turn on a coil nut is 1/8 in and about 6 lb, diagonally.
          <b> Holes</b> are fixed positions on a bracket. <b>Parts</b> come off the trailer: springs, shocks, tires, wheels. The shocks have no
          adjusters, so you swap shocks and change nitrogen.
        </p>
        <h3>What to trust</h3>
        <p className="help-p">
          Directions come from the Bicknell setup book's troubleshooting tables, and every one is checked by an automated test. The sizes of the effects,
          the track lap times, hole counts on some brackets, and the rule limits are estimates. Tune them in <code>src/data</code>.
        </p>
      </section>
      <section className="panel">
        <h2>Terms</h2>
        <dl className="terms">
          {TERMS.map(([t, d]) => (
            <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  );
}
