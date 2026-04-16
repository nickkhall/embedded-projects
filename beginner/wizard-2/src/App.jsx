import { useState, useEffect, useRef } from "react";

const PROJECTS = [
  {
    id: 4,
    title: "Traffic Light",
    subtitle: "State Machines — How Real Embedded Works",
    color: "#ef4444",
    steps: [
      {
        title: "What is a State Machine?",
        content: `Every complex embedded system — from a washing machine to an automotive ECU (Engine Control Unit) — is built around **state machines**. This is probably the single most important concept in embedded software design.

A state machine is simple: your system is always in exactly **one state**, and it transitions to other states based on **events** or **time**. A traffic light is the perfect example:

• State: GREEN → after 5 seconds → transition to YELLOW
• State: YELLOW → after 2 seconds → transition to RED
• State: RED → after 5 seconds → transition to GREEN

At any moment, the traffic light is in exactly one state. It can't be green and red at the same time. Each state has a defined behavior (which LEDs are on) and a defined exit condition (time elapsed).

This maps directly to PLC programming if you've used it — ladder logic with states and transitions is essentially a state machine. The difference is that in embedded C, you implement it explicitly with code rather than graphically.

**Why this matters:** Your company's machines almost certainly run state machines on the PLCs right now. When you move to embedded, the state machine logic stays the same — only the implementation changes.`,
        visual: "stateMachine",
        code: null,
        takeaway: "A state machine keeps your system in exactly one state at a time, with defined transitions. It's the backbone of almost every embedded system — and it maps directly to PLC logic."
      },
      {
        title: "Enums: Naming Your States",
        content: `In the debounce project, you tracked state with a **bool** — the LED was either on or off. Two states, true or false.

A traffic light has three states: GREEN, YELLOW, RED. You could use integers (0, 1, 2), but that leads to confusing code — what does "if (state == 2)" mean? You'd have to remember that 2 means RED.

Instead, we use an **enum** (short for "enumeration"). An enum lets you create a named list of related constants. Under the hood, they're just integers — the compiler assigns 0, 1, 2 automatically — but your code reads like English.

This is a professional practice. Every embedded codebase you'll ever work with uses enums for state machines. When you read your company's PLC code, the states probably have names too — enums are the C equivalent.

One more thing: we declare the enum **outside** of any function, at the top of the file. This makes it available everywhere in the program — both in setup() and loop(). The variable **currentState** is also global because it needs to persist across loop iterations, just like your debounce variables did.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'enum TrafficState {', explanation: '"enum" creates a new type with named values. TrafficState is now a type, just like int or bool.' },
            { code: '  GREEN,', explanation: 'The compiler assigns this the value 0. But you never need to know that — you just use the name GREEN.' },
            { code: '  YELLOW,', explanation: 'This gets value 1 automatically.' },
            { code: '  RED', explanation: 'This gets value 2. The last item has no comma.' },
            { code: '};', explanation: 'Don\'t forget the semicolon after the closing brace — this is a common syntax error.' },
            { code: '', explanation: null },
            { code: 'TrafficState currentState = GREEN;', explanation: 'Declare a variable of our new type. The traffic light starts in GREEN. This is global — it persists across loop() calls.' },
          ]
        },
        takeaway: "Enums give meaningful names to states. They make your code readable and self-documenting. Every professional state machine uses them."
      },
      {
        title: "The Hardware: Three LEDs",
        content: `We need three LEDs — red, yellow, and green — each with its own current-limiting resistor. Each LED gets its own GPIO pin so we can control them independently.

**Pin assignments:**
• PA0 → Green LED (through 220Ω resistor)
• PA1 → Yellow LED (through 220Ω resistor)  
• PA2 → Red LED (through 220Ω resistor)

Each LED circuit is identical to what you built in Project 2: pin → resistor → LED anode → LED cathode → GND. We're just doing it three times on three different pins.

**Why three separate pins?** Each GPIO pin can only be HIGH or LOW — you can't put "yellow" on a pin. To control three LEDs independently, you need three pins. This is how real traffic lights work too — each lamp has its own driver circuit.

In Wokwi, you'll place three LEDs and three resistors. It looks like more wiring, but each circuit is the same pattern you already know.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define GREEN_LED  PA0', explanation: 'Green LED on Port A, Pin 0.' },
            { code: '#define YELLOW_LED PA1', explanation: 'Yellow LED on Port A, Pin 1. Pins right next to each other on the board.' },
            { code: '#define RED_LED    PA2', explanation: 'Red LED on Port A, Pin 2.' },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(GREEN_LED, OUTPUT);', explanation: 'All three pins configured as outputs.' },
            { code: '  pinMode(YELLOW_LED, OUTPUT);', explanation: null },
            { code: '  pinMode(RED_LED, OUTPUT);', explanation: null },
            { code: '  Serial.begin(9600);', explanation: null },
            { code: '  Serial.println("Traffic Light - Starting GREEN");', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Each LED needs its own GPIO pin and its own current-limiting resistor. Multiple outputs follow the same pattern you already know — just repeated."
      },
      {
        title: "A Helper Function: setLights()",
        content: `Before we write the state machine logic, let's create a **helper function**. Instead of writing three digitalWrite() calls every time we change state, we make a function that takes three on/off values and sets all three LEDs at once.

This is a fundamental embedded practice: **wrap repeated hardware operations in functions**. It reduces mistakes (you can't forget to turn off the yellow LED when switching to red if the function handles all three) and makes the state machine code clean and readable.

In bare-metal, you'd do something even more efficient — write all three pin states to the GPIO output register in a single operation. One register write instead of three function calls. But the concept is the same: abstract the hardware behind a clean interface.

Notice that this function takes **bool** parameters — true means ON, false means OFF. This is more readable than HIGH/LOW because we're not thinking about pin voltages anymore, we're thinking about "is this light on?"`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void setLights(bool green, bool yellow, bool red) {', explanation: 'A function that controls all three LEDs at once. Pass true for ON, false for OFF.' },
            { code: '  digitalWrite(GREEN_LED, green);', explanation: 'true becomes HIGH (LED on), false becomes LOW (LED off). C treats bool as 1 or 0.' },
            { code: '  digitalWrite(YELLOW_LED, yellow);', explanation: null },
            { code: '  digitalWrite(RED_LED, red);', explanation: 'All three LEDs set in one function call — clean and error-proof.' },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: '// Usage examples:', explanation: null },
            { code: '// setLights(true, false, false);   // Green only', explanation: 'First parameter is green, second yellow, third red. Easy to read.' },
            { code: '// setLights(false, true, false);   // Yellow only', explanation: null },
            { code: '// setLights(false, false, true);   // Red only', explanation: null },
          ]
        },
        takeaway: "Wrap repeated hardware operations in functions. It reduces bugs, improves readability, and is the first step toward building hardware abstraction layers — a core embedded engineering concept."
      },
      {
        title: "Non-Blocking Timing (Again)",
        content: `In the blink project, you used **delay()** to wait between LED changes. That works for blinking, but it has a fatal flaw: **nothing else can happen during a delay**. If you used delay(5000) for the green light, you couldn't read a pedestrian button, check a sensor, or do anything else for 5 seconds.

In the debounce project, you solved this with **millis()** — checking elapsed time without blocking. We use the exact same technique here.

The pattern is:
1. Record when you entered a state: **stateStartTime = millis()**
2. On every loop, check if enough time has passed: **millis() - stateStartTime > duration**
3. If yes, transition to the next state

This is the same pattern as your debounce timer, but applied to state durations instead of button stability. The concept transfers everywhere in embedded — any time you need to wait without blocking.

In an RTOS (Real-Time Operating System), which you'll learn later, you'd use a proper timer or task delay instead. But understanding non-blocking timing in bare-metal is essential before moving to RTOS.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'unsigned long stateStartTime = 0;', explanation: 'Records when we entered the current state. Same pattern as lastDebounceTime from Project 3.' },
            { code: '', explanation: null },
            { code: 'const unsigned long GREEN_TIME  = 5000;', explanation: '5 seconds for green. "const" means this value never changes — it\'s a constant. Using named constants instead of magic numbers makes code self-documenting.' },
            { code: 'const unsigned long YELLOW_TIME = 2000;', explanation: '2 seconds for yellow — short, like a real traffic light.' },
            { code: 'const unsigned long RED_TIME    = 5000;', explanation: '5 seconds for red.' },
          ]
        },
        takeaway: "Never use delay() when your system needs to do multiple things. Use millis() comparisons for non-blocking timing — the same pattern you learned in debounce, applied everywhere."
      },
      {
        title: "The State Machine: switch/case",
        content: `Here's the core of the state machine. The **switch** statement is the natural way to implement state machines in C — each **case** handles one state's behavior and transition logic.

This is the most important code pattern in this entire wizard. Every state machine you'll ever write — whether it's a traffic light, a motor controller, a communication protocol, or a user interface — follows this exact structure:

1. Check which state you're in (switch)
2. Do whatever that state does (set outputs)
3. Check if it's time to leave (transition condition)
4. If yes, change to the next state and reset the timer

Read through this carefully. Notice how each state is self-contained — it knows what to do and when to leave. Adding a new state (like a flashing red) would just mean adding a new case block. The existing states don't need to change.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: null },
            { code: '  switch (currentState) {', explanation: '"switch" evaluates the variable and jumps to the matching case. Much cleaner than a chain of if/else if for state machines.' },
            { code: '', explanation: null },
            { code: '    case GREEN:', explanation: 'We\'re in the GREEN state. This block runs every loop iteration while we\'re green.' },
            { code: '      setLights(true, false, false);', explanation: 'Green on, yellow off, red off. This gets called every loop — that\'s fine, writing the same value to a pin repeatedly does nothing harmful.' },
            { code: '      if (millis() - stateStartTime > GREEN_TIME) {', explanation: 'Has 5 seconds passed since we entered GREEN? Same non-blocking pattern as debounce.' },
            { code: '        currentState = YELLOW;', explanation: 'Transition! Change the state variable. Next loop iteration, the switch will jump to case YELLOW.' },
            { code: '        stateStartTime = millis();', explanation: 'Reset the timer for the new state. Without this, YELLOW would immediately transition because the elapsed time is already > 2 seconds.' },
            { code: '        Serial.println("GREEN -> YELLOW");', explanation: 'Log the transition for debugging.' },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: '"break" exits the switch. Without it, execution would "fall through" into the next case — a common C bug.' },
            { code: '', explanation: null },
            { code: '    case YELLOW:', explanation: null },
            { code: '      setLights(false, true, false);', explanation: 'Yellow on, others off.' },
            { code: '      if (millis() - stateStartTime > YELLOW_TIME) {', explanation: '2 seconds in yellow.' },
            { code: '        currentState = RED;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("YELLOW -> RED");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case RED:', explanation: null },
            { code: '      setLights(false, false, true);', explanation: 'Red on, others off.' },
            { code: '      if (millis() - stateStartTime > RED_TIME) {', explanation: '5 seconds in red, then back to green.' },
            { code: '        currentState = GREEN;', explanation: 'The cycle repeats — this is the "loop" in the state machine.' },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("RED -> GREEN");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "switch/case is the standard pattern for state machines in C. Each state is self-contained: it sets outputs, checks its exit condition, and transitions when ready. This pattern scales from traffic lights to industrial controllers."
      },
      {
        title: "Basic Traffic Light — Complete",
        content: `Here's the basic traffic light program. Build this first and verify it works before adding the pedestrian crossing.

**To build in Wokwi:**
1. Start a new **STM32 Blue Pill** project
2. Add **3 LEDs** (red, yellow, green) and **3 resistors** (220Ω each)
3. Wire each: A0→resistor→green LED→GND, A1→resistor→yellow LED→GND, A2→resistor→red LED→GND
4. Add serial monitor connections in diagram.json (A9/A10)
5. Hit Play and watch the lights cycle

**Get this working first** before moving to the next step. Verify that green stays on for 5 seconds, yellow for 2, red for 5, and it cycles. Check the serial monitor for transition messages.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define GREEN_LED  PA0', explanation: null },
            { code: '#define YELLOW_LED PA1', explanation: null },
            { code: '#define RED_LED    PA2', explanation: null },
            { code: '', explanation: null },
            { code: 'typedef enum { GREEN, YELLOW, RED } TrafficState;', explanation: 'Using typedef so the Arduino preprocessor handles it correctly. Same as a regular enum but compatible with .ino files.' },
            { code: 'TrafficState currentState = GREEN;', explanation: null },
            { code: 'unsigned long stateStartTime = 0;', explanation: null },
            { code: '', explanation: null },
            { code: 'const unsigned long GREEN_TIME  = 5000;', explanation: null },
            { code: 'const unsigned long YELLOW_TIME = 2000;', explanation: null },
            { code: 'const unsigned long RED_TIME    = 5000;', explanation: null },
            { code: '', explanation: null },
            { code: 'void setLights(bool green, bool yellow, bool red) {', explanation: null },
            { code: '  digitalWrite(GREEN_LED, green);', explanation: null },
            { code: '  digitalWrite(YELLOW_LED, yellow);', explanation: null },
            { code: '  digitalWrite(RED_LED, red);', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(GREEN_LED, OUTPUT);', explanation: null },
            { code: '  pinMode(YELLOW_LED, OUTPUT);', explanation: null },
            { code: '  pinMode(RED_LED, OUTPUT);', explanation: null },
            { code: '  Serial.begin(9600);', explanation: null },
            { code: '  Serial.println("Traffic Light - GO");', explanation: null },
            { code: '  stateStartTime = millis();', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  switch (currentState) {', explanation: null },
            { code: '    case GREEN:', explanation: null },
            { code: '      setLights(true, false, false);', explanation: null },
            { code: '      if (millis() - stateStartTime > GREEN_TIME) {', explanation: null },
            { code: '        currentState = YELLOW;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("GREEN -> YELLOW");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case YELLOW:', explanation: null },
            { code: '      setLights(false, true, false);', explanation: null },
            { code: '      if (millis() - stateStartTime > YELLOW_TIME) {', explanation: null },
            { code: '        currentState = RED;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("YELLOW -> RED");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case RED:', explanation: null },
            { code: '      setLights(false, false, true);', explanation: null },
            { code: '      if (millis() - stateStartTime > RED_TIME) {', explanation: null },
            { code: '        currentState = GREEN;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("RED -> GREEN");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Get the basic version working first, then add features. Building incrementally and testing at each step is how professional embedded development works — never write 200 lines and hope it all works."
      },
      {
        title: "Meet the 7-Segment Display",
        content: `Now let's add a pedestrian crossing. When someone presses a button during the green light, a countdown appears on a **7-segment display** — 5, 4, 3, 2, 1, 0 — then the light transitions to yellow.

A 7-segment display is exactly what it sounds like: **7 LED segments** arranged to form digit shapes. Each segment is labeled **a** through **g**. By turning specific combinations on and off, you can display any digit from 0 to 9.

It's really just 7 LEDs in a convenient package. Each segment needs its own GPIO pin, just like the standalone LEDs you've already wired. The only difference is that the segments are physically arranged in a digit shape instead of scattered on a breadboard.

The display also has a **common** pin. In a **common cathode** display, all the cathodes (negative sides) of the 7 LED segments are connected together and go to GND. You turn segments on by driving their pin HIGH. This is the more intuitive type — HIGH means on.

In Wokwi, the part type is **wokwi-7segment**. You can set it to common cathode with the attribute **"common": "cathode"**.

**That means this project uses 7 pins just for the display**, plus 3 for traffic LEDs, plus 1 for the button — 11 GPIO pins total. On a real product, you'd use a display driver chip (like a TM1637) to reduce pin count. But wiring it directly teaches you what those driver chips are doing internally.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '// --- Pin definitions ---', explanation: null },
            { code: '#define GREEN_LED  PA0', explanation: 'Same traffic LED pins as before.' },
            { code: '#define YELLOW_LED PA1', explanation: null },
            { code: '#define RED_LED    PA2', explanation: null },
            { code: '#define PED_BUTTON PA3', explanation: 'Pedestrian button — new addition. Uses internal pull-up.' },
            { code: '', explanation: null },
            { code: '// 7-segment display pins: one per segment', explanation: null },
            { code: 'const int segPins[7] = {PB0, PB1, PB3, PB4, PB5, PB6, PB7};', explanation: 'An array holding the GPIO pin for each segment. Index 0 = segment a (PB0), index 1 = segment b (PB1), and so on. We skip PB2 because it\'s the BOOT1 pin on the Blue Pill and can cause issues.' },
            { code: '//                        a    b    c    d    e    f    g', explanation: 'This comment reminds you which index maps to which segment. You\'ll reference this constantly.' },
          ]
        },
        takeaway: "A 7-segment display is just 7 LEDs in a digit shape. Each segment needs its own GPIO pin. Arrays let you group related pins together so you can loop through them instead of writing 7 separate lines."
      },
      {
        title: "Digit Patterns with Arrays",
        content: `To display a digit, you need to know which of the 7 segments to turn on. For example, the digit "5" needs segments a, c, d, f, and g — but NOT b or e.

You could write a giant if/else chain: "if digit is 0, turn on a,b,c,d,e,f..." — but that's messy and error-prone. Instead, we store the patterns in a **2D array** (an array of arrays).

Each row represents a digit (0-5 since we're counting down from 5). Each column represents a segment (a through g). A **1** means that segment is ON, a **0** means OFF.

This is called a **lookup table** — a common embedded technique. Instead of computing something, you just look up the answer. Lookup tables are used everywhere in embedded: character maps for displays, sine wave values for signal generation, CRC (Cyclic Redundancy Check) tables for communication protocols. They trade a small amount of memory for fast, predictable execution.

The **displayDigit()** function loops through all 7 segments and sets each one according to the pattern. One function call displays any digit — clean and reusable.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '//                          a  b  c  d  e  f  g', explanation: 'Column labels — match the segment positions on the display.' },
            { code: 'const bool digits[6][7] = {', explanation: 'A 2D array: 6 rows (digits 0-5) x 7 columns (segments a-g). "const" because these patterns never change.' },
            { code: '  {1, 1, 1, 1, 1, 1, 0},  // 0', explanation: 'Digit 0: all segments on except g (the middle bar). Makes an "O" shape.' },
            { code: '  {0, 1, 1, 0, 0, 0, 0},  // 1', explanation: 'Digit 1: only b and c (the two right-side vertical segments).' },
            { code: '  {1, 1, 0, 1, 1, 0, 1},  // 2', explanation: 'Digit 2: a, b, d, e, g. Try tracing this on the segment diagram from the previous slide.' },
            { code: '  {1, 1, 1, 1, 0, 0, 1},  // 3', explanation: 'Digit 3: a, b, c, d, g.' },
            { code: '  {0, 1, 1, 0, 0, 1, 1},  // 4', explanation: 'Digit 4: b, c, f, g.' },
            { code: '  {1, 0, 1, 1, 0, 1, 1},  // 5', explanation: 'Digit 5: a, c, d, f, g. No b or e.' },
            { code: '};', explanation: null },
            { code: '', explanation: null },
            { code: 'void displayDigit(int num) {', explanation: 'Takes a digit (0-5) and sets all 7 segments to match the pattern.' },
            { code: '  for (int i = 0; i < 7; i++) {', explanation: 'Loop through all 7 segments. i=0 is segment a, i=1 is segment b, etc.' },
            { code: '    digitalWrite(segPins[i], digits[num][i]);', explanation: 'segPins[i] gets the GPIO pin for segment i. digits[num][i] gets whether that segment should be on (1) or off (0) for the requested digit. One line replaces 7 separate digitalWrite calls.' },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void clearDisplay() {', explanation: 'Turns off all segments — blank display.' },
            { code: '  for (int i = 0; i < 7; i++) {', explanation: null },
            { code: '    digitalWrite(segPins[i], LOW);', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "2D arrays make perfect lookup tables for segment patterns. The displayDigit() function combines arrays and loops to replace dozens of hardcoded digitalWrite calls with two clean lines. Lookup tables are used everywhere in embedded."
      },
      {
        title: "Updated State Machine",
        content: `Now we add the **PED_COUNTDOWN** state to our enum and update the state machine. The updated flow:

**GREEN** — traffic flows normally. If the pedestrian button is pressed, transition to PED_COUNTDOWN. If the normal green timer expires, transition to YELLOW as before.

**PED_COUNTDOWN** — the display counts down from 5 to 0, one number per second. The traffic light stays GREEN during the countdown (traffic is still flowing while pedestrians get a warning). When the countdown reaches 0, transition to YELLOW.

**YELLOW** — same as before, 2 seconds, then RED.

**RED** — same as before, 5 seconds, then GREEN. The display is blank during this state.

We need two new variables:
• **countdownValue** — which number is currently displayed (starts at 5, decrements to 0)
• **lastCountTime** — when the last number change happened (for the 1-second timing)

And we reuse the **buttonPressed()** edge detection function from the Reaction Game concept — same pattern you already know.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'typedef enum {', explanation: null },
            { code: '  GREEN,', explanation: null },
            { code: '  PED_COUNTDOWN,', explanation: 'New state! Active when a pedestrian has pressed the button.' },
            { code: '  YELLOW,', explanation: null },
            { code: '  RED', explanation: null },
            { code: '} TrafficState;', explanation: null },
            { code: '', explanation: null },
            { code: 'TrafficState currentState = GREEN;', explanation: null },
            { code: 'unsigned long stateStartTime = 0;', explanation: null },
            { code: 'int countdownValue = 5;', explanation: 'Which number the display currently shows. Starts at 5, counts down to 0.' },
            { code: 'unsigned long lastCountTime = 0;', explanation: 'When the countdown last decremented. Used for 1-second non-blocking timing.' },
            { code: 'bool lastButtonState = HIGH;', explanation: 'For edge detection on the pedestrian button.' },
            { code: '', explanation: null },
            { code: 'bool buttonPressed() {', explanation: 'Same edge detection helper you learned in Project 3. Reusable across any project.' },
            { code: '  bool current = digitalRead(PED_BUTTON);', explanation: null },
            { code: '  bool pressed = (current == LOW && lastButtonState == HIGH);', explanation: null },
            { code: '  lastButtonState = current;', explanation: null },
            { code: '  return pressed;', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Adding a state to an existing state machine is straightforward — add it to the enum, add a case block, define entry/exit conditions. The existing states barely change. This is why state machines scale well."
      },
      {
        title: "The PED_COUNTDOWN Logic",
        content: `Here's the updated loop with the new PED_COUNTDOWN state. Pay close attention to two things:

**The GREEN state now has two exit conditions** — the normal timer expiring OR the pedestrian button being pressed. Whichever happens first wins. This is the same "multiple exit conditions" concept from the Reaction Game.

**The PED_COUNTDOWN state uses nested timing** — the outer check is "has the countdown reached 0?" and the inner timing is "has 1 second passed since the last decrement?" Each second, it decrements the counter and updates the display.

Notice that the traffic light stays **GREEN** during the countdown. In a real traffic system, this gives drivers the green light while warning pedestrians that their crossing time is being counted down. The transition to YELLOW only happens after the countdown finishes.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: null },
            { code: '  switch (currentState) {', explanation: null },
            { code: '', explanation: null },
            { code: '    case GREEN:', explanation: null },
            { code: '      setLights(true, false, false);', explanation: 'Green light on as normal.' },
            { code: '      clearDisplay();', explanation: 'No countdown shown during normal green.' },
            { code: '      if (buttonPressed()) {', explanation: 'Pedestrian pressed the button!' },
            { code: '        currentState = PED_COUNTDOWN;', explanation: 'Transition to countdown state.' },
            { code: '        countdownValue = 5;', explanation: 'Start countdown from 5.' },
            { code: '        displayDigit(5);', explanation: 'Immediately show "5" on the display.' },
            { code: '        lastCountTime = millis();', explanation: 'Start the 1-second timer for the first decrement.' },
            { code: '        Serial.println("PED BUTTON -> Countdown started");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      else if (millis() - stateStartTime > GREEN_TIME) {', explanation: 'Normal green timeout — no pedestrian pressed the button in time.' },
            { code: '        currentState = YELLOW;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("GREEN -> YELLOW");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case PED_COUNTDOWN:', explanation: 'Counting down on the display. Traffic light stays GREEN.' },
            { code: '      setLights(true, false, false);', explanation: 'Still green — traffic is still flowing during countdown.' },
            { code: '      if (millis() - lastCountTime > 1000) {', explanation: 'Has 1 second passed since last decrement?' },
            { code: '        countdownValue--;', explanation: 'Decrement: 5 becomes 4, 4 becomes 3, etc.' },
            { code: '        lastCountTime = millis();', explanation: 'Reset the 1-second timer.' },
            { code: '        if (countdownValue < 0) {', explanation: 'Countdown finished — went below 0.' },
            { code: '          clearDisplay();', explanation: 'Turn off the display.' },
            { code: '          currentState = YELLOW;', explanation: 'Now transition to yellow — pedestrian crossing is starting.' },
            { code: '          stateStartTime = millis();', explanation: null },
            { code: '          Serial.println("COUNTDOWN -> YELLOW");', explanation: null },
            { code: '        } else {', explanation: 'Countdown still going — update the display.' },
            { code: '          displayDigit(countdownValue);', explanation: 'Show the new number. The lookup table handles which segments to light up.' },
            { code: '          Serial.print("Countdown: ");', explanation: null },
            { code: '          Serial.println(countdownValue);', explanation: null },
            { code: '        }', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case YELLOW:', explanation: 'Same as before — no changes needed.' },
            { code: '      setLights(false, true, false);', explanation: null },
            { code: '      clearDisplay();', explanation: 'Make sure display is off during yellow and red.' },
            { code: '      if (millis() - stateStartTime > YELLOW_TIME) {', explanation: null },
            { code: '        currentState = RED;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("YELLOW -> RED");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case RED:', explanation: null },
            { code: '      setLights(false, false, true);', explanation: null },
            { code: '      clearDisplay();', explanation: null },
            { code: '      if (millis() - stateStartTime > RED_TIME) {', explanation: null },
            { code: '        currentState = GREEN;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("RED -> GREEN");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Adding a state to a well-structured state machine is clean — the existing states barely change. PED_COUNTDOWN nests a 1-second timer inside the state to control the display update rate."
      },
      {
        title: "Complete Pedestrian Traffic Light",
        content: `Here's the full program. To set up in Wokwi:

1. Start with your working basic traffic light
2. Add a **7-segment display** (wokwi-7segment, set common to "cathode")
3. Wire the 7 segment pins: B0=a, B1=b, B3=c, B4=d, B5=e, B6=f, B7=g
4. Wire the display's **COM** pin to **GND**
5. Add a **push button** between A3 and GND
6. Add **220Ω resistors** for each segment pin (7 resistors) — same reason as the LEDs
7. Hit Play, wait for green, press the button, watch the countdown

**In your diagram.json**, the 7-segment display part looks like:
**{ "type": "wokwi-7segment", "id": "seg1", "attrs": { "common": "cathode" } }**

**Challenges:**
1. During RED, show a **walk symbol** — maybe display "0" or make all segments flash to indicate it's safe to cross
2. Add a **minimum green time** — if someone presses the button within 2 seconds of green starting, ignore it. Real traffic lights have this to prevent constant interruption
3. Make the countdown speed up in the last 2 seconds — 500ms per digit instead of 1000ms. This mimics real pedestrian signals that blink faster near the end`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define GREEN_LED  PA0', explanation: null },
            { code: '#define YELLOW_LED PA1', explanation: null },
            { code: '#define RED_LED    PA2', explanation: null },
            { code: '#define PED_BUTTON PA3', explanation: null },
            { code: '', explanation: null },
            { code: 'const int segPins[7] = {PB0, PB1, PB3, PB4, PB5, PB6, PB7};', explanation: 'Segment pins: a=PB0, b=PB1, c=PB3, d=PB4, e=PB5, f=PB6, g=PB7.' },
            { code: '', explanation: null },
            { code: 'const bool digits[6][7] = {', explanation: 'Lookup table for digits 0-5.' },
            { code: '  {1,1,1,1,1,1,0},  // 0', explanation: null },
            { code: '  {0,1,1,0,0,0,0},  // 1', explanation: null },
            { code: '  {1,1,0,1,1,0,1},  // 2', explanation: null },
            { code: '  {1,1,1,1,0,0,1},  // 3', explanation: null },
            { code: '  {0,1,1,0,0,1,1},  // 4', explanation: null },
            { code: '  {1,0,1,1,0,1,1},  // 5', explanation: null },
            { code: '};', explanation: null },
            { code: '', explanation: null },
            { code: 'typedef enum { GREEN, PED_COUNTDOWN, YELLOW, RED } TrafficState;', explanation: null },
            { code: 'TrafficState currentState = GREEN;', explanation: null },
            { code: 'unsigned long stateStartTime = 0;', explanation: null },
            { code: 'int countdownValue = 5;', explanation: null },
            { code: 'unsigned long lastCountTime = 0;', explanation: null },
            { code: 'bool lastButtonState = HIGH;', explanation: null },
            { code: '', explanation: null },
            { code: 'const unsigned long GREEN_TIME  = 5000;', explanation: null },
            { code: 'const unsigned long YELLOW_TIME = 2000;', explanation: null },
            { code: 'const unsigned long RED_TIME    = 5000;', explanation: null },
            { code: '', explanation: null },
            { code: 'void setLights(bool green, bool yellow, bool red) {', explanation: null },
            { code: '  digitalWrite(GREEN_LED, green);', explanation: null },
            { code: '  digitalWrite(YELLOW_LED, yellow);', explanation: null },
            { code: '  digitalWrite(RED_LED, red);', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void displayDigit(int num) {', explanation: null },
            { code: '  for (int i = 0; i < 7; i++) {', explanation: null },
            { code: '    digitalWrite(segPins[i], digits[num][i]);', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void clearDisplay() {', explanation: null },
            { code: '  for (int i = 0; i < 7; i++) {', explanation: null },
            { code: '    digitalWrite(segPins[i], LOW);', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'bool buttonPressed() {', explanation: null },
            { code: '  bool current = digitalRead(PED_BUTTON);', explanation: null },
            { code: '  bool pressed = (current == LOW && lastButtonState == HIGH);', explanation: null },
            { code: '  lastButtonState = current;', explanation: null },
            { code: '  return pressed;', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(GREEN_LED, OUTPUT);', explanation: null },
            { code: '  pinMode(YELLOW_LED, OUTPUT);', explanation: null },
            { code: '  pinMode(RED_LED, OUTPUT);', explanation: null },
            { code: '  pinMode(PED_BUTTON, INPUT_PULLUP);', explanation: 'Don\'t forget INPUT_PULLUP — you debugged this exact bug earlier!' },
            { code: '  for (int i = 0; i < 7; i++) {', explanation: 'Loop to set all 7 segment pins as outputs. Much cleaner than 7 separate pinMode calls.' },
            { code: '    pinMode(segPins[i], OUTPUT);', explanation: null },
            { code: '  }', explanation: null },
            { code: '  clearDisplay();', explanation: 'Start with display off.' },
            { code: '  Serial.begin(9600);', explanation: null },
            { code: '  Serial.println("Pedestrian Traffic Light - Ready");', explanation: null },
            { code: '  stateStartTime = millis();', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  switch (currentState) {', explanation: null },
            { code: '    case GREEN:', explanation: null },
            { code: '      setLights(true, false, false);', explanation: null },
            { code: '      clearDisplay();', explanation: null },
            { code: '      if (buttonPressed()) {', explanation: null },
            { code: '        currentState = PED_COUNTDOWN;', explanation: null },
            { code: '        countdownValue = 5;', explanation: null },
            { code: '        displayDigit(5);', explanation: null },
            { code: '        lastCountTime = millis();', explanation: null },
            { code: '        Serial.println("PED BUTTON -> Countdown");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      else if (millis() - stateStartTime > GREEN_TIME) {', explanation: null },
            { code: '        currentState = YELLOW;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("GREEN -> YELLOW");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case PED_COUNTDOWN:', explanation: null },
            { code: '      setLights(true, false, false);', explanation: null },
            { code: '      if (millis() - lastCountTime > 1000) {', explanation: null },
            { code: '        countdownValue--;', explanation: null },
            { code: '        lastCountTime = millis();', explanation: null },
            { code: '        if (countdownValue < 0) {', explanation: null },
            { code: '          clearDisplay();', explanation: null },
            { code: '          currentState = YELLOW;', explanation: null },
            { code: '          stateStartTime = millis();', explanation: null },
            { code: '          Serial.println("COUNTDOWN -> YELLOW");', explanation: null },
            { code: '        } else {', explanation: null },
            { code: '          displayDigit(countdownValue);', explanation: null },
            { code: '          Serial.print("Countdown: ");', explanation: null },
            { code: '          Serial.println(countdownValue);', explanation: null },
            { code: '        }', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case YELLOW:', explanation: null },
            { code: '      setLights(false, true, false);', explanation: null },
            { code: '      clearDisplay();', explanation: null },
            { code: '      if (millis() - stateStartTime > YELLOW_TIME) {', explanation: null },
            { code: '        currentState = RED;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("YELLOW -> RED");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case RED:', explanation: null },
            { code: '      setLights(false, false, true);', explanation: null },
            { code: '      clearDisplay();', explanation: null },
            { code: '      if (millis() - stateStartTime > RED_TIME) {', explanation: null },
            { code: '        currentState = GREEN;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("RED -> GREEN");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "You just built a multi-peripheral embedded system: 3 LEDs, a 7-segment display, a button, UART output, and a 4-state state machine with both time-based and event-based transitions. This is closer to real product firmware than most tutorials ever get."
      }
    ]
  },
  {
    id: 5,
    title: "Analog & PWM",
    subtitle: "Reading and Writing the Analog World",
    color: "#8b5cf6",
    steps: [
      {
        title: "Beyond Digital: The Analog World",
        content: `So far everything has been **digital** — HIGH or LOW, 1 or 0, 3.3V or 0V. A button is either pressed or not. An LED is either on or off.

But the real world is **analog**. Temperature doesn't jump from "cold" to "hot" — it varies smoothly. A motor doesn't run at "off" or "full speed" — you want to control it precisely. A sensor might output 1.7V to represent 25°C, or 2.3V for 35°C.

To bridge digital and analog, microcontrollers have two key peripherals:

**ADC (Analog-to-Digital Converter):** Reads an analog voltage and converts it to a number. The STM32's ADC is 12-bit, meaning it converts a voltage between 0V and 3.3V into a number between 0 and 4095. So 0V = 0, 1.65V = ~2048, 3.3V = 4095.

**PWM (Pulse Width Modulation):** Fakes an analog output using rapid digital switching. Instead of actually outputting 1.65V, it rapidly switches between 0V and 3.3V — if it's HIGH half the time, the average is 1.65V. An LED dimmed this way appears at half brightness because it's blinking faster than your eye can see.

This project combines both: read a **potentiometer** (analog input) and use its value to control **LED brightness** (PWM output).`,
        visual: "pwm",
        code: null,
        takeaway: "ADC converts real-world analog voltages to numbers your code can use. PWM creates the illusion of analog output by switching a digital pin on and off really fast."
      },
      {
        title: "The Potentiometer: A Variable Resistor",
        content: `A **potentiometer** (or "pot") is a resistor with a knob. As you turn the knob, it changes the resistance, which changes the voltage on its output pin. In Wokwi, you can click and drag to simulate turning the knob.

It has three pins:
• **VCC** — connect to 3.3V (the high end of the range)
• **GND** — connect to ground (the low end)
• **SIG** (signal/wiper) — the output that varies between 0V and 3.3V based on knob position

When the knob is fully counterclockwise: SIG outputs ~0V (ADC reads ~0)
When the knob is centered: SIG outputs ~1.65V (ADC reads ~2048)
When the knob is fully clockwise: SIG outputs ~3.3V (ADC reads ~4095)

This is a **voltage divider** — the pot creates a variable ratio between VCC and GND. You'll learn exactly how voltage dividers work when you study analog circuits, but for now just know that turning the knob smoothly varies the output voltage.

Potentiometers are everywhere in embedded: volume knobs, position sensors, calibration adjustments. Your company's machines probably use them for operator controls.`,
        visual: null,
        code: null,
        takeaway: "A potentiometer outputs a variable voltage between 0V and 3.3V based on its position. The ADC reads this voltage as a number between 0 and 4095."
      },
      {
        title: "Reading Analog: analogRead()",
        content: `**analogRead()** triggers the ADC to sample the voltage on a pin and returns a number. On the STM32, this number ranges from 0 to 4095 (12-bit resolution).

Under the hood, this is a complex process:
1. The ADC's multiplexer selects the correct input channel
2. A sample-and-hold circuit captures the voltage
3. A successive approximation register (SAR) converts the voltage to a digital value
4. The result is stored in a data register that your code reads

In bare-metal, you'd configure all of this manually — enable the ADC clock, set the channel, configure the sample time, start the conversion, wait for it to complete, then read the result register. Your Udemy course will cover this in detail.

With Arduino, **analogRead()** does all of that in one call. The tradeoff is that it's slower — each conversion takes microseconds, and you can't configure advanced features like DMA (Direct Memory Access) transfers or continuous conversion mode. But for reading a knob position, it's plenty fast.

**Important:** Not every pin can do analog input. Only pins connected to an ADC channel work. On the STM32, PA0 through PA7 all have ADC capability. The datasheet lists which pins map to which ADC channels.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define POT_PIN PA0', explanation: 'PA0 has ADC capability — it\'s connected to ADC channel 0. Not all pins can do analog input.' },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(POT_PIN, INPUT);', explanation: 'Configure as input. For analog reading, this is INPUT (no pull-up needed — the pot provides its own voltage).' },
            { code: '  Serial.begin(9600);', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  int potValue = analogRead(POT_PIN);', explanation: 'Read the ADC. Returns 0-4095 on STM32 (12-bit). On Arduino Uno it would be 0-1023 (10-bit). The resolution depends on the hardware.' },
            { code: '  Serial.println(potValue);', explanation: 'Print the raw value. Turn the pot in Wokwi and watch this number change.' },
            { code: '  delay(100);', explanation: 'Small delay so the serial monitor doesn\'t flood. 10 readings per second is plenty for a knob.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "analogRead() returns 0-4095 representing the voltage on the pin. Under the hood, it triggers a complex ADC conversion process that you'll learn to do manually in bare-metal."
      },
      {
        title: "PWM Output: analogWrite()",
        content: `**PWM** works by switching a pin ON and OFF very rapidly. The ratio of ON time to total time is called the **duty cycle**:

• 0% duty cycle = always OFF = LED dark
• 25% duty cycle = ON 25% of the time = LED dim
• 50% duty cycle = ON half the time = LED medium brightness
• 100% duty cycle = always ON = LED full brightness

**analogWrite(pin, value)** sets the duty cycle. The value ranges from 0 (0% duty) to 255 (100% duty).

Under the hood, PWM uses a **hardware timer** peripheral. The timer counts up at a set frequency, and the output pin goes HIGH when the count is below your value and LOW when it's above. The switching happens so fast (typically thousands of times per second) that an LED appears to be smoothly dimmed rather than blinking.

This is how motors are speed-controlled, heaters are temperature-regulated, and servos are positioned in real embedded systems. PWM is fundamental — your company's machines almost certainly use it for motor control.

**Not every pin supports PWM.** Only pins connected to timer output channels can do PWM. On the Blue Pill, pins like PA0-PA3, PA6-PA7, PB0-PB1 support PWM through various timers.`,
        visual: "dutyCycle",
        code: null,
        takeaway: "PWM rapidly switches a pin on/off at varying ratios to simulate analog output. 0-255 controls the duty cycle. It relies on hardware timers — a peripheral you'll configure manually in bare-metal."
      },
      {
        title: "Mapping Values: The map() Function",
        content: `Here's a practical problem: **analogRead()** returns 0-4095, but **analogWrite()** expects 0-255. We need to convert between ranges.

The **map()** function does linear interpolation — it takes a value from one range and proportionally maps it to another. Think of it like unit conversion: converting Celsius to Fahrenheit, or inches to millimeters.

**map(value, fromLow, fromHigh, toLow, toHigh)**

So map(2048, 0, 4095, 0, 255) returns ~127. Half the input range maps to half the output range.

In bare-metal, there's no map() function — you'd write it yourself. It's just basic math:

**output = (input - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow**

This kind of value scaling shows up constantly in embedded: converting ADC readings to temperature, mapping sensor values to motor speeds, scaling joystick positions to servo angles. Writing your own map function is a useful exercise.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define POT_PIN PA0', explanation: null },
            { code: '#define LED_PIN PA1', explanation: 'LED on PA1 — this pin supports PWM through Timer 2.' },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  int potValue = analogRead(POT_PIN);', explanation: 'Read pot: 0 to 4095.' },
            { code: '', explanation: null },
            { code: '  int brightness = map(potValue, 0, 4095, 0, 255);', explanation: 'Convert 0-4095 range to 0-255 range. When pot is at midpoint (2048), brightness becomes ~127 (half).' },
            { code: '', explanation: null },
            { code: '  analogWrite(LED_PIN, brightness);', explanation: 'Set PWM duty cycle. 0 = off, 127 = half brightness, 255 = full brightness.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "map() converts between value ranges — essential when your input and output peripherals use different scales. In bare-metal, you'd write this as a simple math function yourself."
      },
      {
        title: "Complete Program + Wokwi Setup",
        content: `Here's the complete program. To set this up in Wokwi:

1. Start a new **STM32 Blue Pill** project
2. Add a **Potentiometer**, an **LED**, and a **220Ω resistor**
3. Wire the potentiometer: VCC → 3.3V pin, GND → G pin, SIG → A0
4. Wire the LED: A1 → resistor → LED anode → LED cathode → GND
5. Add serial monitor connections in diagram.json
6. Hit Play and drag the potentiometer knob

You should see the LED smoothly change brightness as you turn the knob, and the serial monitor shows the raw and mapped values.

**Challenges:**
1. **Reverse the mapping** — fully clockwise = dim, fully counterclockwise = bright. Hint: swap the toLow and toHigh in map().
2. **Add a dead zone** — if the pot is below 100, the LED should be completely off. This is common in motor control to prevent motors from buzzing at very low speeds.
3. **Add a second LED on PA2** and make it do the inverse brightness — when one is bright, the other is dim. This simulates a crossfade.
4. **Display the percentage** — calculate and print the brightness as a percentage (0-100%) on the serial monitor.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define POT_PIN PA0', explanation: null },
            { code: '#define LED_PIN PA1', explanation: null },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(POT_PIN, INPUT);', explanation: 'Analog input — no pull-up needed.' },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: 'PWM output for the LED.' },
            { code: '  Serial.begin(9600);', explanation: null },
            { code: '  Serial.println("PWM Dimmer - Ready");', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  int potValue = analogRead(POT_PIN);', explanation: 'Read the potentiometer: 0-4095.' },
            { code: '  int brightness = map(potValue, 0, 4095, 0, 255);', explanation: 'Map to PWM range: 0-255.' },
            { code: '  analogWrite(LED_PIN, brightness);', explanation: 'Set LED brightness via PWM.' },
            { code: '', explanation: null },
            { code: '  Serial.print("Pot: ");', explanation: null },
            { code: '  Serial.print(potValue);', explanation: null },
            { code: '  Serial.print(" -> Brightness: ");', explanation: null },
            { code: '  Serial.println(brightness);', explanation: null },
            { code: '', explanation: null },
            { code: '  delay(100);', explanation: 'Read 10 times per second — smooth enough for a knob, slow enough for serial.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "You just combined analog input (ADC) with analog output (PWM). This read-process-output pattern is the heart of every control system — from LED dimmers to industrial motor controllers."
      }
    ]
  },
  {
    id: 6,
    title: "Reaction Game",
    subtitle: "Timers, Randomness, and Putting It All Together",
    color: "#f59e0b",
    steps: [
      {
        title: "The Game: Test Your Reflexes",
        content: `Time to build something fun that combines everything you've learned. Here's the game:

1. Program starts, LED is off — "Get ready..."
2. After a **random delay** (1-5 seconds), the LED turns on
3. Player presses the button as fast as they can
4. Program measures the **reaction time** in milliseconds
5. Result is printed over UART and the game resets

This project isn't just for fun — it exercises critical embedded skills:

**Random timing** — You'll use randomness, which is surprisingly important in embedded. Communication protocols use random backoff times, security systems need random numbers, and test systems randomize their sequences.

**Precise time measurement** — Measuring elapsed time in milliseconds is how you benchmark code, measure sensor pulse widths, and calculate speeds.

**State machine** — The game has clear states: WAITING, READY, REACT, RESULT. You'll reuse the exact pattern from the traffic light.

**Cheat detection** — What if someone holds the button before the LED turns on? You need to handle this. Input validation and error handling are critical in real embedded systems.`,
        visual: null,
        code: null,
        takeaway: "This game combines state machines, timing, input handling, randomness, and UART output — all skills that transfer directly to real embedded work."
      },
      {
        title: "Random Numbers in Embedded",
        content: `Computers are deterministic — they do exactly what you tell them, every time. So how do you get a "random" number?

**random(min, max)** returns a pseudo-random number between min and max-1. It uses a mathematical formula that produces a sequence of numbers that look random but are actually predictable if you know the starting point.

The starting point is called the **seed**. If you use the same seed every time, you get the same "random" sequence. That's useless for a game — the delays would be identical every time.

**randomSeed()** sets the starting point. The trick is to seed it with something unpredictable. On Arduino, people often use **analogRead()** on an unconnected pin — the floating pin picks up random electrical noise, giving a different seed each time.

In real embedded security applications (encryption, authentication), pseudo-random numbers aren't good enough. The STM32 has a hardware **True Random Number Generator (TRNG)** that uses physical noise inside the chip. But for a game, pseudo-random is perfectly fine.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void setup() {', explanation: null },
            { code: '  randomSeed(analogRead(PA3));', explanation: 'Read noise from an unconnected pin to seed the random number generator. PA3 has nothing wired to it, so it picks up random electrical noise from the environment.' },
            { code: '', explanation: null },
            { code: '  long waitTime = random(1000, 5000);', explanation: 'Generate a random number between 1000 and 4999 — that\'s 1 to ~5 seconds in milliseconds.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "random() generates pseudo-random numbers from a seed. Seed with electrical noise from a floating pin for unpredictability. Real security applications use hardware random number generators."
      },
      {
        title: "Game States",
        content: `The game has four distinct states. This is another state machine — the same pattern as the traffic light, but with different transition triggers.

In the traffic light, transitions were time-based — "after 5 seconds, switch." In this game, transitions are triggered by a mix of time AND user input:

• WAITING → (button press) → READY
• READY → (random time passes) → REACT
• REACT → (button press) → RESULT
• RESULT → (short delay) → WAITING

But there's a gotcha: **what if the player presses the button during READY, before the LED turns on?** That's cheating — or at least a false start. We need to detect this and handle it. This is exactly the kind of edge case that embedded engineers deal with constantly — users do unexpected things, and your code has to handle every possibility without crashing.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN    PA0', explanation: null },
            { code: '#define BUTTON_PIN PB0', explanation: null },
            { code: '', explanation: null },
            { code: 'enum GameState {', explanation: 'Four states for our game state machine.' },
            { code: '  WAITING,', explanation: 'Idle — waiting for the player to start a round by pressing the button.' },
            { code: '  READY,', explanation: 'Countdown — LED is off, waiting for random delay to expire. Player must NOT press yet.' },
            { code: '  REACT,', explanation: 'LED is ON — player must press as fast as possible. We\'re measuring time.' },
            { code: '  RESULT', explanation: 'Display the reaction time, then reset after a short pause.' },
            { code: '};', explanation: null },
            { code: '', explanation: null },
            { code: 'GameState currentState = WAITING;', explanation: null },
            { code: 'unsigned long stateStartTime = 0;', explanation: 'When we entered the current state.' },
            { code: 'unsigned long randomDelay = 0;', explanation: 'How long to wait in READY state before turning on the LED.' },
            { code: 'unsigned long reactionTime = 0;', explanation: 'The measured reaction time — our final result.' },
            { code: 'bool lastButtonState = HIGH;', explanation: 'For edge detection — we only react to the press transition, not holding.' },
          ]
        },
        takeaway: "State machines can mix time-based and event-based transitions. Handling unexpected input (like pressing too early) is a core embedded skill — users always do things you don't expect."
      },
      {
        title: "Edge Detection Reuse",
        content: `In Project 3, you built debounce logic to detect button presses. For this game, we'll simplify — we just need **edge detection** without full debouncing. In Wokwi, simulated buttons don't bounce, and for a reaction time game, we want the fastest possible response.

The pattern is the same as the core of your debounce code: compare the current reading to the last reading, and only act on the HIGH-to-LOW transition (falling edge).

We put this in a **helper function** — a reusable piece of code that returns true when a new press is detected. This is cleaner than copying the edge detection logic into every state that needs it.

This is a good habit to develop: when you use the same logic in multiple places, extract it into a function. In your bare-metal code later, you might have a whole file of utility functions for button handling, timing, and serial communication.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'bool buttonPressed() {', explanation: 'A helper function that returns true ONCE per press — on the falling edge only.' },
            { code: '  bool current = digitalRead(BUTTON_PIN);', explanation: 'Read the pin right now.' },
            { code: '  bool pressed = (current == LOW && lastButtonState == HIGH);', explanation: 'True ONLY when: right now it\'s LOW (pressed) AND last time it was HIGH (not pressed). This is falling edge detection — the same concept from Project 3.' },
            { code: '  lastButtonState = current;', explanation: 'Save for next call. Remember — this was the bug you found in Project 3. Always update at the end.' },
            { code: '  return pressed;', explanation: 'Returns true for exactly one loop iteration per press. Clean and reusable.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Extract repeated logic into helper functions. This buttonPressed() function encapsulates edge detection and can be reused across any project — you'll build a library of these utilities over time."
      },
      {
        title: "The Game Loop",
        content: `Here's the complete state machine. Read through each state carefully — notice how each one has clear entry behavior, ongoing behavior, and exit conditions.

Pay special attention to the **READY** state. It has TWO exit conditions:
1. Random delay expires → transition to REACT (normal)
2. Player presses button too early → print "Too early!" and go back to WAITING (error handling)

This is common in real state machines — a state might have multiple possible transitions depending on what event occurs first. A motor controller might exit its "running" state because of either a stop command OR an overcurrent fault. The state handles both.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: null },
            { code: '  switch (currentState) {', explanation: null },
            { code: '', explanation: null },
            { code: '    case WAITING:', explanation: 'Idle state — LED off, waiting for player to start.' },
            { code: '      digitalWrite(LED_PIN, LOW);', explanation: null },
            { code: '      if (buttonPressed()) {', explanation: 'Player pressed the button — they want to play.' },
            { code: '        currentState = READY;', explanation: null },
            { code: '        randomDelay = random(1000, 5000);', explanation: 'Generate a new random delay for this round: 1-5 seconds.' },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("Get ready...");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case READY:', explanation: 'Countdown — LED is off, random delay counting down. Player must wait.' },
            { code: '      if (buttonPressed()) {', explanation: 'Player pressed too early — before the LED turned on!' },
            { code: '        Serial.println("Too early! Wait for the LED.");', explanation: null },
            { code: '        currentState = WAITING;', explanation: 'Go back to idle. They have to start over.' },
            { code: '      }', explanation: null },
            { code: '      else if (millis() - stateStartTime > randomDelay) {', explanation: 'Random delay expired — time to turn on the LED.' },
            { code: '        digitalWrite(LED_PIN, HIGH);', explanation: 'LED ON — the signal to react!' },
            { code: '        currentState = REACT;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: 'Start measuring reaction time from NOW.' },
            { code: '        Serial.println("GO! Press now!");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case REACT:', explanation: 'LED is on — measuring how fast the player reacts.' },
            { code: '      if (buttonPressed()) {', explanation: 'Player pressed the button!' },
            { code: '        reactionTime = millis() - stateStartTime;', explanation: 'Calculate elapsed time since LED turned on. This is the result!' },
            { code: '        digitalWrite(LED_PIN, LOW);', explanation: 'Turn off LED.' },
            { code: '        Serial.print("Reaction time: ");', explanation: null },
            { code: '        Serial.print(reactionTime);', explanation: null },
            { code: '        Serial.println(" ms");', explanation: null },
            { code: '        currentState = RESULT;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '', explanation: null },
            { code: '    case RESULT:', explanation: 'Show result briefly, then reset.' },
            { code: '      if (millis() - stateStartTime > 2000) {', explanation: 'Wait 2 seconds so the player can read the result.' },
            { code: '        Serial.println("\\nPress button to play again...");', explanation: null },
            { code: '        currentState = WAITING;', explanation: 'Back to idle — ready for another round.' },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Real state machines have multiple exit conditions per state — normal transitions and error cases. Always consider: what could go wrong? What unexpected input could arrive? Handle it explicitly."
      },
      {
        title: "Complete Program + What You've Mastered",
        content: `Here's the full program. To set up in Wokwi:

1. New **STM32 Blue Pill** project
2. Add an **LED** with a **220Ω resistor** on PA0
3. Add a **push button** between PB0 and GND
4. Add serial monitor connections (A9/A10)
5. Hit Play, press the button, wait for "GO!", press again as fast as you can

**Challenges:**
1. **Track the best score** — keep a variable for the fastest reaction time and display it after each round. Reset it with a long button hold (> 2 seconds).
2. **Add difficulty levels** — after each round, shorten the random delay range. Start with 2-5 seconds, after 3 rounds narrow to 1-3 seconds.
3. **Add a "too slow" timeout** — if the player doesn't press within 3 seconds after the LED turns on, print "Too slow!" and reset.
4. **Multiple rounds** — play 5 rounds automatically and display the average reaction time at the end.

**What you've mastered across all 6 projects:**

Projects 1-3 gave you: GPIO, pull-ups, active-low, debouncing, edge detection, state variables, non-blocking timing, UART debugging.

Projects 4-6 added: state machines with enums and switch/case, helper functions, analog input (ADC), analog output (PWM), value mapping, randomness, time measurement, error handling, and cheat detection.

You now have the **conceptual foundation** for everything in your Udemy course. Every register you configure, every peripheral you set up — you already understand what it does and why you need it. The course just teaches you the "how" at the hardware level.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN    PA0', explanation: null },
            { code: '#define BUTTON_PIN PB0', explanation: null },
            { code: '', explanation: null },
            { code: 'enum GameState { WAITING, READY, REACT, RESULT };', explanation: null },
            { code: 'GameState currentState = WAITING;', explanation: null },
            { code: 'unsigned long stateStartTime = 0;', explanation: null },
            { code: 'unsigned long randomDelay = 0;', explanation: null },
            { code: 'unsigned long reactionTime = 0;', explanation: null },
            { code: 'bool lastButtonState = HIGH;', explanation: null },
            { code: '', explanation: null },
            { code: 'bool buttonPressed() {', explanation: null },
            { code: '  bool current = digitalRead(BUTTON_PIN);', explanation: null },
            { code: '  bool pressed = (current == LOW && lastButtonState == HIGH);', explanation: null },
            { code: '  lastButtonState = current;', explanation: null },
            { code: '  return pressed;', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: null },
            { code: '  pinMode(BUTTON_PIN, INPUT_PULLUP);', explanation: null },
            { code: '  Serial.begin(9600);', explanation: null },
            { code: '  randomSeed(analogRead(PA3));', explanation: 'Seed with noise from unconnected pin.' },
            { code: '  Serial.println("=== Reaction Time Game ===");', explanation: null },
            { code: '  Serial.println("Press button to start...");', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  switch (currentState) {', explanation: null },
            { code: '    case WAITING:', explanation: null },
            { code: '      digitalWrite(LED_PIN, LOW);', explanation: null },
            { code: '      if (buttonPressed()) {', explanation: null },
            { code: '        currentState = READY;', explanation: null },
            { code: '        randomDelay = random(1000, 5000);', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("Get ready...");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case READY:', explanation: null },
            { code: '      if (buttonPressed()) {', explanation: null },
            { code: '        Serial.println("Too early! Wait for the LED.");', explanation: null },
            { code: '        currentState = WAITING;', explanation: null },
            { code: '      }', explanation: null },
            { code: '      else if (millis() - stateStartTime > randomDelay) {', explanation: null },
            { code: '        digitalWrite(LED_PIN, HIGH);', explanation: null },
            { code: '        currentState = REACT;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '        Serial.println("GO! Press now!");', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case REACT:', explanation: null },
            { code: '      if (buttonPressed()) {', explanation: null },
            { code: '        reactionTime = millis() - stateStartTime;', explanation: null },
            { code: '        digitalWrite(LED_PIN, LOW);', explanation: null },
            { code: '        Serial.print("Reaction time: ");', explanation: null },
            { code: '        Serial.print(reactionTime);', explanation: null },
            { code: '        Serial.println(" ms");', explanation: null },
            { code: '        currentState = RESULT;', explanation: null },
            { code: '        stateStartTime = millis();', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '    case RESULT:', explanation: null },
            { code: '      if (millis() - stateStartTime > 2000) {', explanation: null },
            { code: '        Serial.println("\\nPress button to play again...");', explanation: null },
            { code: '        currentState = WAITING;', explanation: null },
            { code: '      }', explanation: null },
            { code: '      break;', explanation: null },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "You've now built 6 embedded projects covering GPIO, ADC, PWM, state machines, timing, UART, and input handling. These aren't toy concepts — they're the foundation of every embedded system in production."
      }
    ]
  }
];

const Visuals = {
  stateMachine: () => (
    <svg viewBox="0 0 500 180" style={{ width: "100%", maxWidth: 500 }}>
      <defs>
        <marker id="smArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <circle cx="80" cy="90" r="40" fill="#065f46" stroke="#10b981" strokeWidth="2"/>
      <text x="80" y="86" textAnchor="middle" fill="#10b981" fontSize="13" fontFamily="monospace" fontWeight="bold">GREEN</text>
      <text x="80" y="104" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontFamily="monospace">5 sec</text>
      
      <circle cx="250" cy="90" r="40" fill="#78350f" stroke="#f59e0b" strokeWidth="2"/>
      <text x="250" y="86" textAnchor="middle" fill="#f59e0b" fontSize="13" fontFamily="monospace" fontWeight="bold">YELLOW</text>
      <text x="250" y="104" textAnchor="middle" fill="#fcd34d" fontSize="10" fontFamily="monospace">2 sec</text>
      
      <circle cx="420" cy="90" r="40" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2"/>
      <text x="420" y="86" textAnchor="middle" fill="#ef4444" fontSize="13" fontFamily="monospace" fontWeight="bold">RED</text>
      <text x="420" y="104" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">5 sec</text>
      
      <line x1="120" y1="80" x2="200" y2="80" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#smArrow)"/>
      <line x1="290" y1="80" x2="370" y2="80" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#smArrow)"/>
      <path d="M420 130 Q420 165 250 165 Q80 165 80 130" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#smArrow)"/>
      
      <text x="160" y="72" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">timeout</text>
      <text x="330" y="72" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">timeout</text>
      <text x="250" y="158" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">timeout</text>
    </svg>
  ),
  pwm: () => (
    <svg viewBox="0 0 500 200" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="18" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">PWM — Pulse Width Modulation:</text>
      
      <text x="20" y="48" fill="#64748b" fontSize="10" fontFamily="monospace">25% duty (dim)</text>
      <polyline points="120,55 140,55 140,35 170,35 170,55 290,55 290,35 320,35 320,55 440,55" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
      
      <text x="20" y="98" fill="#64748b" fontSize="10" fontFamily="monospace">50% duty (medium)</text>
      <polyline points="120,105 180,105 180,85 240,85 240,105 300,105 300,85 360,85 360,105 440,105" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
      
      <text x="20" y="148" fill="#64748b" fontSize="10" fontFamily="monospace">75% duty (bright)</text>
      <polyline points="120,155 130,155 130,135 220,135 220,155 230,155 230,135 320,135 320,155 330,155 330,135 420,135 420,155 440,155" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
      
      <text x="20" y="185" fill="#475569" fontSize="9" fontFamily="monospace">More time HIGH = more average voltage = brighter LED</text>
    </svg>
  ),
  dutyCycle: () => (
    <svg viewBox="0 0 500 120" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="18" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">analogWrite values → duty cycle → brightness:</text>
      
      {[0, 64, 128, 192, 255].map((val, i) => {
        const x = 30 + i * 95;
        const pct = Math.round(val / 255 * 100);
        const barHeight = Math.max(2, (val / 255) * 50);
        return (
          <g key={i}>
            <rect x={x} y={90 - barHeight} width="60" height={barHeight} rx="3" fill="#8b5cf6" opacity={0.3 + (val/255) * 0.7}/>
            <text x={x + 30} y="105" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontFamily="monospace" fontWeight="bold">{val}</text>
            <text x={x + 30} y="45" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">{pct}%</text>
          </g>
        );
      })}
    </svg>
  )
};

function CodeBlock({ codeData }) {
  const [revealedLines, setRevealedLines] = useState(0);
  const [expandedLine, setExpandedLine] = useState(null);
  const codeLines = codeData.lines;
  const totalLines = codeLines.length;
  const allRevealed = revealedLines >= totalLines;

  const revealNext = () => {
    let next = revealedLines + 1;
    while (next < totalLines && codeLines[next].code === '' && codeLines[next].explanation === null) next++;
    setRevealedLines(Math.min(next, totalLines));
    setExpandedLine(next - 1);
  };

  const revealAll = () => { setRevealedLines(totalLines); setExpandedLine(null); };

  return (
    <div style={{ margin: "20px 0", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      <div style={{ background: "#0f172a", padding: "4px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b" }}>
        <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>sketch.ino</span>
        <div style={{ display: "flex", gap: 8 }}>
          {!allRevealed && (
            <>
              <button onClick={revealNext} style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}>Next Line →</button>
              <button onClick={revealAll} style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", padding: "4px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>Show All</button>
            </>
          )}
          {allRevealed && <span style={{ color: "#10b981", fontSize: 12, fontFamily: "monospace" }}>✓ Complete</span>}
        </div>
      </div>
      <div style={{ background: "#0a0e1a", padding: "12px 0", fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: 13, lineHeight: "1.7", overflowX: "auto", textAlign: "left" }}>
        {codeLines.slice(0, revealedLines).map((line, i) => (
          <div key={i}>
            <div onClick={() => line.explanation ? setExpandedLine(expandedLine === i ? null : i) : null}
              style={{ padding: "1px 16px", background: expandedLine === i && line.explanation ? "#1e293b" : "transparent", cursor: line.explanation ? "pointer" : "default", borderLeft: expandedLine === i && line.explanation ? "3px solid #8b5cf6" : "3px solid transparent", transition: "all 0.15s ease", whiteSpace: "pre" }}>
              <span style={{ color: "#334155", fontSize: 11, marginRight: 12, userSelect: "none", display: "inline-block", width: 20, textAlign: "right" }}>{i + 1}</span>
              <span style={{ color: line.code.startsWith('//') || line.code.startsWith('  //') ? "#475569" : line.code.includes('#define') || line.code.includes('enum') ? "#c084fc" : line.code.includes('void ') || line.code.includes('bool ') || line.code.includes('case ') ? "#3b82f6" : "#e2e8f0" }}>{line.code || '\u00A0'}</span>
              {line.explanation && <span style={{ color: "#8b5cf6", fontSize: 10, marginLeft: 8, opacity: 0.6 }}>●</span>}
            </div>
            {expandedLine === i && line.explanation && (
              <div style={{ padding: "8px 16px 8px 52px", background: "#141c2e", borderLeft: "3px solid #8b5cf6", color: "#cbd5e1", fontSize: 12, lineHeight: 1.6, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                {line.explanation}
              </div>
            )}
          </div>
        ))}
        {!allRevealed && revealedLines < totalLines && (
          <div style={{ padding: "4px 16px", color: "#334155", fontSize: 12, fontStyle: "italic" }}>... {totalLines - revealedLines} more line{totalLines - revealedLines > 1 ? 's' : ''} — click "Next Line"</div>
        )}
      </div>
    </div>
  );
}

export default function EmbeddedWizard2() {
  const [currentProject, setCurrentProject] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  const project = PROJECTS[currentProject];
  const step = project.steps[currentStep];
  const totalSteps = project.steps.length;
  const isFirstStep = currentStep === 0 && currentProject === 0;
  const isLastStep = currentStep === totalSteps - 1 && currentProject === PROJECTS.length - 1;

  useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, [currentProject, currentStep]);

  const goNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
    else if (currentProject < PROJECTS.length - 1) { setCurrentProject(currentProject + 1); setCurrentStep(0); }
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else if (currentProject > 0) { setCurrentProject(currentProject - 1); setCurrentStep(PROJECTS[currentProject - 1].steps.length - 1); }
  };

  const globalStepIndex = PROJECTS.slice(0, currentProject).reduce((acc, p) => acc + p.steps.length, 0) + currentStep;
  const totalGlobalSteps = PROJECTS.reduce((acc, p) => acc + p.steps.length, 0);
  const progressPercent = ((globalStepIndex + 1) / totalGlobalSteps) * 100;
  const VisualComponent = step.visual ? Visuals[step.visual] : null;

  const renderContent = (text) => text.split('\n\n').map((para, i) => (
    <p key={i} style={{ margin: "0 0 16px 0", lineHeight: 1.75 }}>
      {para.split(/(\*\*.*?\*\*)/).map((seg, j) => seg.startsWith('**') && seg.endsWith('**')
        ? <strong key={j} style={{ color: "#f1f5f9", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>
        : <span key={j}>{seg}</span>
      )}
    </p>
  ));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0c1222", color: "#94a3b8", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6", fontFamily: "monospace", letterSpacing: -0.5 }}>⚡ EMBEDDED</span>
            <span style={{ fontSize: 13, color: "#475569", fontFamily: "monospace" }}>Wizard — Part 2</span>
          </div>
          <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{globalStepIndex + 1} / {totalGlobalSteps}</span>
        </div>
        <div style={{ height: 3, background: "#1e293b" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, #8b5cf6, ${project.color})`, width: `${progressPercent}%`, transition: "width 0.4s ease" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, background: "#0f172a", borderBottom: "1px solid #1e293b", flexShrink: 0, overflowX: "auto" }}>
        {PROJECTS.map((p, i) => (
          <button key={p.id} onClick={() => { setCurrentProject(i); setCurrentStep(0); }}
            style={{ flex: "1 1 0", padding: "12px 16px", background: i === currentProject ? "#0c1222" : "transparent", border: "none", borderBottom: i === currentProject ? `2px solid ${p.color}` : "2px solid transparent", color: i === currentProject ? p.color : "#475569", fontFamily: "monospace", fontSize: 12, fontWeight: i === currentProject ? 700 : 400, cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 14 }}>P{p.id}</span><span style={{ marginLeft: 6 }}>{p.title}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, padding: "12px 20px", background: "#0c1222", flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
        {project.steps.map((s, i) => (
          <button key={i} onClick={() => setCurrentStep(i)} title={s.title}
            style={{ width: i === currentStep ? "auto" : 28, height: 28, borderRadius: 14, border: `1.5px solid ${i === currentStep ? project.color : i < currentStep ? project.color + "60" : "#1e293b"}`, background: i < currentStep ? project.color + "20" : i === currentStep ? project.color + "15" : "transparent", color: i === currentStep ? project.color : i < currentStep ? project.color : "#334155", fontSize: 11, fontFamily: "monospace", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: i === currentStep ? "0 12px" : 0, transition: "all 0.2s ease", whiteSpace: "nowrap", flexShrink: 0 }}>
            {i === currentStep ? `${i + 1}. ${s.title}` : i < currentStep ? "✓" : i + 1}
          </button>
        ))}
      </div>

      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}>
          <div style={{ margin: "24px 0 20px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", lineHeight: 1.3 }}>{step.title}</h2>
            <span style={{ fontSize: 12, color: project.color, fontFamily: "monospace" }}>{project.title} — Step {currentStep + 1} of {totalSteps}</span>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.75, color: "#94a3b8" }}>{renderContent(step.content)}</div>
          {VisualComponent && (
            <div style={{ margin: "24px 0", padding: 20, background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}><VisualComponent /></div>
          )}
          {step.code && <CodeBlock codeData={step.code} key={`${currentProject}-${currentStep}`} />}
          {step.takeaway && (
            <div style={{ margin: "24px 0", padding: "16px 20px", background: "#14251a", borderRadius: 8, border: "1px solid #166534", borderLeft: "4px solid #10b981" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 6, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>Key Takeaway</div>
              <div style={{ fontSize: 14, color: "#86efac", lineHeight: 1.6 }}>{step.takeaway}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "12px 20px", background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={goPrev} disabled={isFirstStep}
          style={{ padding: "10px 20px", borderRadius: 6, border: "1px solid #1e293b", background: isFirstStep ? "transparent" : "#1e293b", color: isFirstStep ? "#334155" : "#94a3b8", fontSize: 13, fontFamily: "monospace", cursor: isFirstStep ? "default" : "pointer", fontWeight: 600 }}>← Back</button>
        <span style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>
          {currentStep < totalSteps - 1 ? "Next step" : currentProject < PROJECTS.length - 1 ? "Next project →" : "Complete!"}
        </span>
        <button onClick={goNext} disabled={isLastStep}
          style={{ padding: "10px 20px", borderRadius: 6, border: "none", background: isLastStep ? "#1e293b" : project.color, color: isLastStep ? "#334155" : "#fff", fontSize: 13, fontFamily: "monospace", cursor: isLastStep ? "default" : "pointer", fontWeight: 700 }}>
          {currentStep < totalSteps - 1 ? "Continue →" : currentProject < PROJECTS.length - 1 ? "Start Project " + (currentProject + 2) + " →" : "Done ✓"}
        </button>
      </div>
    </div>
  );
}