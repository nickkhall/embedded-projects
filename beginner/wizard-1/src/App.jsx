import { useState, useEffect, useRef } from "react";

const PROJECTS = [
  {
    id: 1,
    title: "Blink",
    subtitle: "The Hello World of Embedded",
    color: "#f59e0b",
    steps: [
      {
        title: "What is GPIO?",
        content: `Every microcontroller has pins — physical metal legs that connect the chip to the outside world. Some pins are for power (VCC, GND), some are for special functions, but most are **GPIO: General Purpose Input/Output**.

GPIO is exactly what it sounds like. You can configure each pin to be either an **input** (reading a voltage from the outside world — like a button or sensor) or an **output** (driving a voltage out — like turning on an LED or motor).

This is the absolute foundation of embedded systems. Everything starts with controlling pins. A self-driving car, a medical device, a smart thermostat — at the lowest level, they're all just reading and writing GPIO pins really fast with really smart logic.

On the STM32 Blue Pill, the pins are organized into **ports** — groups of 16 pins each. The ports are named A, B, C, etc. So **PA0** means Port A, Pin 0. **PC13** means Port C, Pin 13. You'll see this naming convention on every STM32.`,
        visual: "gpio",
        code: null,
        takeaway: "GPIO pins are how your microcontroller talks to the physical world. Each pin can be configured as an input or output."
      },
      {
        title: "Meet the Blue Pill",
        content: `The STM32 Blue Pill is a small development board built around the **STM32F103C6** microcontroller — an ARM Cortex-M3 chip running at **72 MHz**. That's 72 million operations per second. For context, the original Game Boy ran at about 4 MHz.

The board has one important feature for us right now: an **onboard LED connected to pin PC13**. This means we can make something happen in the physical world without wiring up any external components.

Here's the critical detail: **the LED is wired between 3.3V (power) and PC13**. This means:
• When PC13 outputs HIGH (3.3V), both sides of the LED are at 3.3V → no current flows → **LED is OFF**
• When PC13 outputs LOW (0V), current flows from 3.3V through the LED to PC13 → **LED is ON**

This is called **active-low** logic, and it seems backwards at first. But it's extremely common in embedded systems. Many chips, buttons, and LEDs use active-low logic. Get comfortable with it now — you'll see it constantly.`,
        visual: "activeLow",
        code: null,
        takeaway: "The Blue Pill's onboard LED is active-low: pin LOW = LED ON, pin HIGH = LED OFF. This pattern is everywhere in embedded."
      },
      {
        title: "Configuring a Pin as Output",
        content: `Before you can use a GPIO pin, you have to tell the microcontroller what you want to do with it. Is it an input? An output? Should it use a pull-up resistor? How fast should it switch?

In this Arduino-style code, we use **pinMode()** to configure the pin. But here's what you need to know: under the hood, this function is writing to a specific **register** inside the chip.

A register is just a small piece of memory that controls hardware behavior. On the STM32, the GPIO configuration registers are called **CRL** (for pins 0-7) and **CRH** (for pins 8-15). Since PC13 is pin 13, it's configured through GPIOC->CRH.

Your Udemy course will teach you to write directly to these registers. For now, understand that **every time you call a function like pinMode(), you're ultimately just writing a number to a specific memory address** that the hardware reads to configure itself.

This is the key insight of embedded programming: **hardware and software meet at memory addresses**.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN PC13', explanation: 'We give PC13 a meaningful name. In C, #define is a text replacement — everywhere the compiler sees LED_PIN, it substitutes PC13. This makes code readable and easy to change later.' },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: 'setup() runs once when the board powers on or resets. This is where you configure your hardware before the main loop starts.' },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: 'Tell the STM32: "I want to DRIVE pin PC13 — set it as an output." Under the hood, this writes to the GPIOC configuration register to set PC13\'s mode bits to output.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "pinMode() configures a GPIO pin's direction. Under the hood, it writes to hardware configuration registers — specific memory addresses that control how the pin behaves."
      },
      {
        title: "The Infinite Loop",
        content: `In web development, your code runs in response to events — a click, a request, a timer. There's always an operating system managing everything.

In embedded, **there is no operating system** (at least not on bare-metal). Your code IS the only thing running on the entire chip. And it must never, ever stop. If your code exits, the microcontroller has nothing to do — it just sits there doing nothing until you reset it.

This is why every embedded program has an **infinite loop**. In Arduino-style code, this is the **loop()** function — it gets called over and over forever. In bare-metal C, you'd write it as **while(1) { }** inside your main function.

This is a fundamental mindset shift from other programming: **your code is responsible for everything, and it never stops running**. There's no garbage collector, no event loop, no process manager. Just your code and the hardware.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: 'loop() is called repeatedly, forever. In bare-metal C, this would be: while(1) { ... } inside main(). The concept is identical.' },
            { code: '  // Everything in here runs over and over', explanation: 'At 72 MHz, if your loop body is simple, it can execute millions of times per second.' },
            { code: '  // The loop NEVER exits', explanation: 'If this function returned, the microcontroller would have nothing to execute. In embedded, you always run forever.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Embedded code runs in an infinite loop — forever. There's no OS to return to. Your program IS the entire system."
      },
      {
        title: "Driving the Pin: digitalWrite",
        content: `Now for the actual action. **digitalWrite()** sets a pin to either HIGH (3.3V) or LOW (0V).

On the STM32, this writes to a register called **BSRR** (Bit Set/Reset Register) or **ODR** (Output Data Register). These registers directly control the voltage on the physical pin.

When you write HIGH to PC13, the chip's internal circuitry connects that pin to 3.3V. When you write LOW, it connects the pin to 0V (ground). This happens in nanoseconds — literally billions of a second.

Remember our active-low LED: we write **LOW** to turn it ON, and **HIGH** to turn it OFF.

**delay()** pauses execution for the specified number of milliseconds. The chip is literally doing nothing during this time (well, it's running a countdown loop internally). This is called a **blocking delay** — nothing else can happen while it waits. This is fine for blinking an LED, but in real embedded systems, blocking delays are usually bad practice because they prevent you from responding to other events. You'll learn better approaches later.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: null },
            { code: '  digitalWrite(LED_PIN, LOW);', explanation: 'Set PC13 to 0V. Since the LED is active-low, this turns it ON. Under the hood, this writes to GPIOC->BSRR to reset (clear) pin 13.' },
            { code: '  delay(500);', explanation: 'Wait 500 milliseconds (half a second). The CPU is blocked — it literally sits in a loop counting down and does nothing else.' },
            { code: '  digitalWrite(LED_PIN, HIGH);', explanation: 'Set PC13 to 3.3V. LED turns OFF. Writes to GPIOC->BSRR to set pin 13.' },
            { code: '  delay(500);', explanation: 'Wait another half second. Then loop() restarts from the top.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "digitalWrite() controls pin voltage by writing to hardware registers. delay() is a blocking wait — simple but prevents any other code from running."
      },
      {
        title: "The Complete Program",
        content: `Here's everything together. This is your complete first embedded program. Every single line has a purpose — there's no boilerplate, no imports, no framework overhead. What you write is what runs on the metal.

**To run this in Wokwi:**
1. Go to wokwi.com and click "Start a New Project"
2. Select the **STM32 Blue Pill** board
3. Replace the default code with the code below
4. Click the green Play button
5. Watch the green LED on the board blink

Once it's running, try these experiments:
• Change 500 to 100 — what happens? (It blinks faster)
• Change 500 to 2000 — what happens? (It blinks slower)
• Make the ON time different from the OFF time — try 100 and 900
• Can you make it do two quick blinks, then a long pause? (Hint: you need more digitalWrite/delay pairs)`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN PC13', explanation: 'Name the pin for readability.' },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: 'Runs once at power-on.' },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: 'Configure PC13 as output.' },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: 'Runs forever.' },
            { code: '  digitalWrite(LED_PIN, LOW);', explanation: 'LED ON (active-low).' },
            { code: '  delay(500);', explanation: 'Wait half second.' },
            { code: '  digitalWrite(LED_PIN, HIGH);', explanation: 'LED OFF.' },
            { code: '  delay(500);', explanation: 'Wait half second, then repeat.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "You just wrote your first embedded program. It configures hardware, runs forever, and controls a physical output. Everything else in embedded builds on these exact concepts."
      }
    ]
  },
  {
    id: 2,
    title: "Button + LED",
    subtitle: "Reading the Physical World",
    color: "#3b82f6",
    steps: [
      {
        title: "GPIO Input: Reading Voltage",
        content: `In Project 1, you used GPIO as an **output** — driving a pin high or low. Now you'll use GPIO as an **input** — reading whether a pin is high or low.

When a pin is configured as an input, the microcontroller measures the voltage on that pin and reports it as either **HIGH** (close to 3.3V) or **LOW** (close to 0V). This is called **digital input** — it only tells you HIGH or LOW, not the exact voltage. (Analog input, which measures exact voltage, uses a different peripheral called the ADC — you'll learn that later.)

This is how microcontrollers sense the physical world. A button, a door sensor, a motion detector — they all work by changing a voltage that the microcontroller reads as HIGH or LOW.

But there's a catch. What happens when nothing is connected to an input pin? What voltage does it read?`,
        visual: null,
        code: null,
        takeaway: "GPIO input reads voltage on a pin as HIGH or LOW. This is how your microcontroller senses the physical world — buttons, sensors, switches."
      },
      {
        title: "The Floating Pin Problem",
        content: `When an input pin isn't connected to anything, it **floats**. It picks up random electrical noise from the environment — radio waves, nearby wires, static electricity. The pin rapidly bounces between HIGH and LOW unpredictably. It's like an antenna picking up garbage.

This is a critical concept: **an unconnected digital input does NOT default to LOW**. It reads random noise. This is one of the most common beginner mistakes in embedded.

The solution is a **pull-up resistor** or **pull-down resistor**:

**Pull-up resistor:** Connects the pin to VCC (3.3V) through a resistor. The pin reads HIGH by default. When you press a button that connects the pin to GND, it reads LOW. This is called **active-low** input.

**Pull-down resistor:** Connects the pin to GND through a resistor. The pin reads LOW by default. When you press a button that connects the pin to VCC, it reads HIGH.

The STM32 has these resistors **built into the chip**. You activate them in software with **INPUT_PULLUP** or **INPUT_PULLDOWN**. This saves you from wiring external resistors — a huge convenience.

We'll use **INPUT_PULLUP** because it's the most common pattern in embedded. The button connects the pin to GND when pressed, and the internal pull-up holds it HIGH when released.`,
        visual: "pullup",
        code: null,
        takeaway: "Unconnected input pins float and read random noise. Pull-up resistors fix this by giving the pin a default HIGH state. The STM32 has internal pull-ups you activate in software."
      },
      {
        title: "The Circuit: Why the Resistor Matters",
        content: `We're adding two external components: an **LED** and a **push button**.

**The LED circuit: PA0 → 220Ω resistor → LED → GND**

LEDs have almost no resistance. If you connect an LED directly to a GPIO pin without a resistor, too much current flows through it. This can:
• Burn out the LED
• Damage the GPIO pin on your microcontroller
• Draw more current than the pin can supply

The **current-limiting resistor** prevents this. Here's the math:

The STM32 outputs 3.3V. A typical red LED drops about 2.0V across it (this is called the **forward voltage** — every LED datasheet lists it). That leaves 1.3V across the resistor. Using Ohm's Law: R = V / I = 1.3V / 0.01A = 130Ω. We use 220Ω to be safe — the LED just glows a little dimmer.

This kind of calculation is something PLC programmers rarely do, but embedded engineers do constantly. You're designing the electrical interface, not just the code.

**The button circuit: PB0 → button → GND**

When the button is pressed, it connects PB0 directly to GND, pulling it LOW. When released, the internal pull-up resistor holds PB0 at HIGH. No external resistor needed.`,
        visual: "circuit",
        code: null,
        takeaway: "Always use a current-limiting resistor with LEDs. The value is calculated from Ohm's Law using the supply voltage, LED forward voltage, and desired current."
      },
      {
        title: "Setting Up Both Pins",
        content: `Now we configure two pins — one as output for the LED, one as input for the button. This is the first time you're using GPIO in both directions in the same program.

Notice that on the STM32, we're using pins from different ports: PA0 (Port A) and PB0 (Port B). In bare-metal programming, this matters because you'd need to enable the clock for BOTH ports separately. Each port has its own set of registers. The Arduino layer handles this for you, but in your Udemy course, you'll write:

**RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;**  ← Enable Port A clock
**RCC->APB2ENR |= RCC_APB2ENR_IOPBEN;**  ← Enable Port B clock

If you forget to enable a port's clock, writing to its registers does absolutely nothing. No error, no warning — it just silently doesn't work. This is one of the most frustrating beginner debugging experiences in bare-metal STM32.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN     PA0', explanation: 'External LED on Port A, Pin 0. We chose PA0 because it\'s easy to access on the Blue Pill header.' },
            { code: '#define BUTTON_PIN  PB0', explanation: 'Button on Port B, Pin 0. Using a different port from the LED — in bare-metal, each port needs its clock enabled separately.' },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: 'PA0 as output — we\'ll drive this pin to control the LED.' },
            { code: '  pinMode(BUTTON_PIN, INPUT_PULLUP);', explanation: 'PB0 as input WITH internal pull-up enabled. Without the pull-up, this pin would float and give random readings.' },
            { code: '  digitalWrite(LED_PIN, LOW);', explanation: 'Start with LED off. Good practice to set a known state for all outputs during setup.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Configure outputs and inputs in setup(). Always enable pull-ups on button inputs. In bare-metal, forgetting to enable a port's clock is a silent, frustrating failure."
      },
      {
        title: "Reading Input and Responding",
        content: `**digitalRead()** returns either HIGH or LOW — the current voltage on the pin.

With our pull-up configuration:
• Button **NOT pressed** → pin is pulled HIGH → digitalRead returns **HIGH**
• Button **pressed** → pin connected to GND → digitalRead returns **LOW**

This is **polling** — we check the button state every single time through the loop. At 72 MHz with this simple code, we're checking millions of times per second. That's massively wasteful, but it works fine for learning.

The better approach (which you'll learn later) is **interrupts** — the hardware notifies your code when the pin changes, instead of you constantly asking "has it changed yet?" Think of it as the difference between constantly refreshing a webpage versus using WebSockets. Same idea, different domain.

One more thing: notice there's **no delay()** in this loop. The loop runs at full CPU speed. For reading a button, this is fine. But it means the CPU is doing a LOT of redundant work — reading the same pin state millions of times between human button presses.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: null },
            { code: '  int buttonState = digitalRead(BUTTON_PIN);', explanation: 'Read PB0 voltage right now. Returns HIGH (not pressed, pull-up holds it high) or LOW (pressed, connected to GND). This reads the GPIO Input Data Register (IDR).' },
            { code: '', explanation: null },
            { code: '  if (buttonState == LOW) {', explanation: 'LOW means pressed (active-low with pull-up). This is a simple conditional — if the button is being pressed at this exact moment...' },
            { code: '    digitalWrite(LED_PIN, HIGH);', explanation: '...turn the LED on by driving PA0 high (3.3V through resistor through LED to ground).' },
            { code: '  } else {', explanation: 'Otherwise the button is released (pin is HIGH from pull-up)...' },
            { code: '    digitalWrite(LED_PIN, LOW);', explanation: '...turn the LED off.' },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Polling reads the pin in a tight loop — simple but wasteful. Interrupts (learned later) are the efficient alternative. With pull-ups, pressed = LOW."
      },
      {
        title: "Complete Program + Wokwi Setup",
        content: `Here's the complete program. To set this up in Wokwi:

1. Go to **wokwi.com** → New Project → **STM32 Blue Pill**
2. Paste the code below into the code editor
3. Click the **"+"** button to add components: one **LED** (red) and one **Push Button**
4. Wire them up:
   • **PA0** → **220Ω resistor** → **LED anode** (long leg)
   • **LED cathode** (short leg) → **GND**
   • **PB0** → **one side of button**
   • **other side of button** → **GND**
5. Hit Play and press the button

If using the diagram.json approach, switch to the diagram tab in Wokwi and paste the JSON from the project files I gave you earlier.

**Experiments to try:**
• Reverse the logic: LED ON when button is NOT pressed
• Add Serial.begin(9600) to setup and Serial.println("Pressed!") in the if block — watch the serial monitor for UART output
• What happens if you use INPUT instead of INPUT_PULLUP? (In Wokwi, the pin will float)`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN     PA0', explanation: null },
            { code: '#define BUTTON_PIN  PB0', explanation: null },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: 'LED pin: output mode.' },
            { code: '  pinMode(BUTTON_PIN, INPUT_PULLUP);', explanation: 'Button pin: input with internal pull-up.' },
            { code: '  digitalWrite(LED_PIN, LOW);', explanation: 'LED starts off.' },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  int buttonState = digitalRead(BUTTON_PIN);', explanation: 'Read button state.' },
            { code: '', explanation: null },
            { code: '  if (buttonState == LOW) {', explanation: 'Pressed? (active-low)' },
            { code: '    digitalWrite(LED_PIN, HIGH);', explanation: 'LED on.' },
            { code: '  } else {', explanation: null },
            { code: '    digitalWrite(LED_PIN, LOW);', explanation: 'LED off.' },
            { code: '  }', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "You now understand GPIO in both directions: output to drive an LED and input to read a button. You've also learned about pull-ups, current limiting, and polling."
      }
    ]
  },
  {
    id: 3,
    title: "Toggle + Debounce",
    subtitle: "Where Embedded Gets Real",
    color: "#10b981",
    steps: [
      {
        title: "Why Toggle Is Harder Than It Looks",
        content: `Here's what we want: press the button once, LED turns on and stays on. Press it again, LED turns off and stays off. Simple, right?

Your first instinct might be: "When the button is pressed, flip the LED state." Something like:

**if (buttonPressed) { ledState = !ledState; }**

Try this mentally: you press the button and hold it for 200 milliseconds. The loop runs at 72 MHz. In those 200 milliseconds, how many times does the loop execute? **Millions of times.** Each time, it sees the button as pressed and flips the LED. The LED toggles millions of times and ends up in an unpredictable state.

OK, so maybe you only flip the LED when the button **changes** from not-pressed to pressed (the **transition**). That's called **edge detection** — you care about the falling edge (HIGH → LOW), not the level.

But that introduces a second problem: **switch bounce**.`,
        visual: null,
        code: null,
        takeaway: "You can't just check 'is the button pressed?' — the loop runs millions of times per second. You need edge detection (reacting to transitions) and debouncing."
      },
      {
        title: "Switch Bounce: A Hardware Problem",
        content: `This is your first encounter with a problem that simply doesn't exist in web development.

When you press a physical button, the metal contacts inside don't make clean contact. They literally **bounce** — rapidly connecting and disconnecting for 1-20 milliseconds before settling. Your microcontroller at 72 MHz sees every single bounce as a separate press/release event.

One physical press might look like this to the MCU:

HIGH → LOW → HIGH → LOW → HIGH → LOW → LOW → LOW (settled)

That's 3 "press" events from one physical press. If you're toggling on each press, the LED flips 3 times and ends up in the wrong state.

**This is why embedded is different from other software.** You're dealing with the imperfect physical world. Buttons bounce, signals have noise, power supplies fluctuate, temperatures change behavior. Every embedded engineer learns to deal with these realities.

The solution is **debouncing**: ignoring rapid changes and only accepting a state change after the signal has been stable for a minimum amount of time (typically 20-50 milliseconds).`,
        visual: "bounce",
        code: null,
        takeaway: "Physical buttons bounce — they rapidly toggle for milliseconds before settling. Your 72 MHz MCU sees every bounce. Debouncing filters this noise by requiring stability over time."
      },
      {
        title: "State: Your Program's Memory",
        content: `In web development, state is managed by frameworks — React state, Redux stores, database queries. In embedded, **you manage all state yourself** using plain variables.

For our toggle, we need to track several pieces of information across loop iterations:

• **ledState** — Is the LED currently on or off?
• **lastButtonState** — What did the button read LAST time through the loop?
• **lastDebounceTime** — When did the button reading last change?

These are **global variables** — they persist across calls to loop(). In web dev, globals are usually considered bad practice. In embedded, they're normal and expected. Here's why:

1. There's no framework to manage state for you
2. Global variables are allocated at compile time — you know exactly how much RAM they use
3. The stack is tiny (often just a few kilobytes), so putting large state on the stack is dangerous
4. There's only one "thread" of execution (for now — RTOS changes this)

When you move to bare-metal, these will be the same — just global variables at the top of your file.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN     PA0', explanation: null },
            { code: '#define BUTTON_PIN  PB0', explanation: null },
            { code: '', explanation: null },
            { code: 'bool ledState = false;', explanation: 'Tracks whether the LED is on (true) or off (false). Persists across loop iterations. This is YOUR responsibility to manage.' },
            { code: 'bool lastButtonState = HIGH;', explanation: 'What the button read last time through the loop. We compare current vs. last to detect transitions (edges).' },
            { code: 'unsigned long lastDebounceTime = 0;', explanation: 'Timestamp (in ms) of the last time the button reading changed. Used to measure how long the signal has been stable.' },
            { code: 'const unsigned long DEBOUNCE_DELAY = 50;', explanation: '50ms stability requirement. If the button reading stays the same for 50ms, we trust it. This value works for most buttons — too low and bounces get through, too high and the button feels laggy.' },
          ]
        },
        takeaway: "In embedded, you manage all state yourself with global variables. This is normal — there's no framework, and globals give you predictable, compile-time-known memory usage."
      },
      {
        title: "Edge Detection: Falling Edge",
        content: `You don't want to react to the button being held down. You want to react to the **moment it transitions** from not-pressed to pressed. This is called detecting a **falling edge** (HIGH → LOW, since our button is active-low).

The concept of edges comes from digital electronics:
• **Falling edge:** HIGH → LOW transition (button press with pull-up)
• **Rising edge:** LOW → HIGH transition (button release with pull-up)
• **Level:** the steady state (button being held)

We detect a falling edge by comparing the current reading to the last confirmed state. If the last confirmed state was HIGH and the new confirmed state is LOW, that's a falling edge — one press.

We deliberately **ignore the rising edge** (button release) because we only want to toggle once per press, not once on press and once on release.

This same concept applies directly to interrupts on STM32 — you can configure an EXTI interrupt to trigger on falling edge, rising edge, or both. The hardware does the edge detection for you. But understanding it in software first makes the hardware version intuitive.`,
        visual: "edge",
        code: null,
        takeaway: "Edge detection means reacting to transitions, not levels. A falling edge (HIGH→LOW) is one button press. This concept maps directly to hardware interrupts you'll learn later."
      },
      {
        title: "The Debounce Algorithm",
        content: `Here's the complete debounce logic. It's the most complex code you've written so far, but every line serves a purpose. Read through it carefully.

The algorithm works in three stages:
1. **Detect any change** in the raw button reading and reset a timer
2. **Wait for stability** — only trust the reading after 50ms of no changes
3. **Detect the falling edge** — only toggle when transitioning from HIGH to LOW

This pattern is reusable. You'll use this exact debounce structure (or variations of it) in almost every embedded project that reads a button. Some engineers put it in a utility function they carry from project to project.

Notice there's **no delay()** anywhere. The timing is handled by comparing timestamps with **millis()**. This is called **non-blocking timing** — the loop keeps running at full speed, and you use time comparisons to decide when to act. This is critical in real embedded systems where you might be reading sensors, updating displays, and checking buttons all in the same loop.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: 'void loop() {', explanation: null },
            { code: '  bool currentReading = digitalRead(BUTTON_PIN);', explanation: 'Read the raw pin state right now. This might be a bounce — we don\'t trust it yet.' },
            { code: '', explanation: null },
            { code: '  // STAGE 1: Detect any change in the raw reading', explanation: null },
            { code: '  if (currentReading != lastButtonState) {', explanation: 'Did the raw reading change since last loop? If yes, the button might be bouncing or might be a real press. We don\'t know yet.' },
            { code: '    lastDebounceTime = millis();', explanation: 'Reset the stability timer. millis() returns ms since power-on. We\'re saying: "the signal just changed, start counting stability time from now."' },
            { code: '  }', explanation: null },
            { code: '', explanation: null },
            { code: '  // STAGE 2: Has the signal been stable long enough?', explanation: null },
            { code: '  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {', explanation: 'Has 50ms passed without any changes? If yes, the signal is stable — this is a real state, not a bounce. The bounces typically settle within 10-20ms.' },
            { code: '', explanation: null },
            { code: '    // STAGE 3: Detect falling edge', explanation: null },
            { code: '    static bool confirmedState = HIGH;', explanation: '"static" means this variable persists across calls (like a global, but scoped to this block). It stores the last CONFIRMED state — not the raw, possibly-bouncing reading.' },
            { code: '    if (currentReading != confirmedState) {', explanation: 'The stable reading differs from our last confirmed state — a real transition happened.' },
            { code: '      confirmedState = currentReading;', explanation: 'Update our confirmed state to the new stable reading.' },
            { code: '      if (confirmedState == LOW) {', explanation: 'Is this specifically a HIGH→LOW transition? (falling edge = button was just pressed)' },
            { code: '        ledState = !ledState;', explanation: 'TOGGLE! Flip the LED state. !false = true, !true = false.' },
            { code: '        digitalWrite(LED_PIN, ledState);', explanation: 'Apply the new state to the actual LED pin.' },
            { code: '      }', explanation: 'We ignore LOW→HIGH (rising edge = button release). We only toggle on press, not release.' },
            { code: '    }', explanation: null },
            { code: '  }', explanation: null },
            { code: '', explanation: null },
            { code: '  lastButtonState = currentReading;', explanation: 'Save the raw reading for next loop iteration. This is used in Stage 1 to detect changes.' },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "Debounce = reset timer on any change, only trust readings that are stable for 50ms, then detect edges. No delay() — timing is non-blocking using millis()."
      },
      {
        title: "Complete Program + What's Next",
        content: `Here's the full program with serial debugging added. The Serial.print lines send text over UART to your computer — this is the embedded equivalent of console.log. In bare-metal, you'd configure the UART peripheral registers directly.

**To test in Wokwi:** Use the same circuit as Project 2 (LED + button). Paste this code in, hit play, and click the button. Open the serial monitor in Wokwi to see the debug messages.

**Test the debounce:** Try commenting out the debounce logic (Stages 1-2) and just detect edges with a simple "if reading != lastState && reading == LOW" approach. Click the button in Wokwi and watch the serial monitor — you'll likely see multiple toggles per click even in simulation.

**What you've learned across all 3 projects:**
• GPIO output and input
• Active-low logic and pull-up resistors
• Current limiting and basic circuit design
• The infinite loop and why embedded code never exits
• State management with global variables
• Switch debouncing and edge detection
• Non-blocking timing
• UART serial debugging

These aren't toy concepts — they're the foundation of every embedded system. Your Udemy course will now teach you to do ALL of this at the register level. The concepts are identical; only the abstraction layer changes.`,
        visual: null,
        code: {
          lang: "cpp",
          lines: [
            { code: '#define LED_PIN     PA0', explanation: null },
            { code: '#define BUTTON_PIN  PB0', explanation: null },
            { code: '', explanation: null },
            { code: 'bool ledState = false;', explanation: null },
            { code: 'bool lastButtonState = HIGH;', explanation: null },
            { code: 'unsigned long lastDebounceTime = 0;', explanation: null },
            { code: 'const unsigned long DEBOUNCE_DELAY = 50;', explanation: null },
            { code: '', explanation: null },
            { code: 'void setup() {', explanation: null },
            { code: '  pinMode(LED_PIN, OUTPUT);', explanation: null },
            { code: '  pinMode(BUTTON_PIN, INPUT_PULLUP);', explanation: null },
            { code: '  digitalWrite(LED_PIN, LOW);', explanation: null },
            { code: '  Serial.begin(9600);', explanation: 'Initialize UART at 9600 baud. This configures the USART peripheral for serial communication with your PC.' },
            { code: '  Serial.println("Toggle with Debounce - Ready");', explanation: null },
            { code: '}', explanation: null },
            { code: '', explanation: null },
            { code: 'void loop() {', explanation: null },
            { code: '  bool currentReading = digitalRead(BUTTON_PIN);', explanation: null },
            { code: '', explanation: null },
            { code: '  if (currentReading != lastButtonState) {', explanation: 'Raw reading changed — reset debounce timer.' },
            { code: '    lastDebounceTime = millis();', explanation: null },
            { code: '  }', explanation: null },
            { code: '', explanation: null },
            { code: '  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {', explanation: 'Stable for 50ms — trust it.' },
            { code: '    static bool confirmedState = HIGH;', explanation: null },
            { code: '    if (currentReading != confirmedState) {', explanation: null },
            { code: '      confirmedState = currentReading;', explanation: null },
            { code: '      if (confirmedState == LOW) {', explanation: 'Falling edge detected — real press.' },
            { code: '        ledState = !ledState;', explanation: null },
            { code: '        digitalWrite(LED_PIN, ledState);', explanation: null },
            { code: '        Serial.print("LED: ");', explanation: null },
            { code: '        Serial.println(ledState ? "ON" : "OFF");', explanation: 'Debug output over UART — your embedded console.log.' },
            { code: '      }', explanation: null },
            { code: '    }', explanation: null },
            { code: '  }', explanation: null },
            { code: '', explanation: null },
            { code: '  lastButtonState = currentReading;', explanation: null },
            { code: '}', explanation: null },
          ]
        },
        takeaway: "You now understand debouncing, edge detection, state management, and non-blocking timing. These are the concepts that separate embedded from other software. Your Udemy course will teach the same ideas at the register level."
      }
    ]
  }
];

/* ── SVG VISUALS ── */
const Visuals = {
  gpio: () => (
    <svg viewBox="0 0 500 200" style={{ width: "100%", maxWidth: 500 }}>
      <defs>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect x="120" y="40" width="260" height="120" rx="8" fill="url(#chipGrad)" stroke="#475569" strokeWidth="2" />
      <text x="250" y="95" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="monospace">STM32F103</text>
      <text x="250" y="115" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">Microcontroller</text>
      {[0,1,2,3,4].map(i => (
        <g key={`l${i}`}>
          <rect x="80" y={52 + i*22} width="40" height="12" rx="2" fill="#f59e0b" opacity="0.8" />
          <line x1="60" y1={58 + i*22} x2="80" y2={58 + i*22} stroke="#f59e0b" strokeWidth="2" />
          <text x="50" y={62 + i*22} textAnchor="end" fill="#f59e0b" fontSize="9" fontFamily="monospace">PA{i}</text>
        </g>
      ))}
      {[0,1,2,3,4].map(i => (
        <g key={`r${i}`}>
          <rect x="380" y={52 + i*22} width="40" height="12" rx="2" fill="#3b82f6" opacity="0.8" />
          <line x1="420" y1={58 + i*22} x2="440" y2={58 + i*22} stroke="#3b82f6" strokeWidth="2" />
          <text x="450" y={62 + i*22} textAnchor="start" fill="#3b82f6" fontSize="9" fontFamily="monospace">PB{i}</text>
        </g>
      ))}
      <text x="65" y="185" fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="middle">Port A</text>
      <text x="435" y="185" fill="#3b82f6" fontSize="11" fontFamily="monospace" textAnchor="middle">Port B</text>
      <text x="250" y="185" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">Each pin can be INPUT or OUTPUT</text>
    </svg>
  ),
  activeLow: () => (
    <svg viewBox="0 0 500 180" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="25" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">Active-Low LED Wiring:</text>
      {/* ON state */}
      <text x="20" y="60" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">LED ON:</text>
      <text x="85" y="80" fill="#94a3b8" fontSize="10" fontFamily="monospace">3.3V</text>
      <line x1="110" y1="76" x2="160" y2="76" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="180" cy="76" r="14" fill="none" stroke="#10b981" strokeWidth="2" />
      <circle cx="180" cy="76" r="6" fill="#10b981" opacity="0.8" />
      <line x1="194" y1="76" x2="244" y2="76" stroke="#94a3b8" strokeWidth="2" />
      <text x="254" y="80" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">PC13 = LOW (0V)</text>
      <text x="85" y="100" fill="#475569" fontSize="9" fontFamily="monospace">Current flows → LED is ON</text>
      {/* OFF state */}
      <text x="20" y="135" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold">LED OFF:</text>
      <text x="85" y="155" fill="#94a3b8" fontSize="10" fontFamily="monospace">3.3V</text>
      <line x1="110" y1="151" x2="160" y2="151" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="180" cy="151" r="14" fill="none" stroke="#475569" strokeWidth="2" />
      <line x1="194" y1="151" x2="244" y2="151" stroke="#94a3b8" strokeWidth="2" />
      <text x="254" y="155" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold">PC13 = HIGH (3.3V)</text>
      <text x="85" y="175" fill="#475569" fontSize="9" fontFamily="monospace">Same voltage both sides → no current → LED is OFF</text>
    </svg>
  ),
  pullup: () => (
    <svg viewBox="0 0 500 220" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="20" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">Pull-Up Resistor — Inside the STM32 Chip:</text>
      <rect x="20" y="35" width="210" height="170" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" strokeDasharray="4" />
      <text x="30" y="55" fill="#475569" fontSize="9" fontFamily="monospace">Inside MCU</text>
      {/* Pull-up to VCC */}
      <text x="80" y="78" fill="#ef4444" fontSize="10" fontFamily="monospace">3.3V</text>
      <line x1="95" y1="82" x2="95" y2="100" stroke="#ef4444" strokeWidth="1.5" />
      <rect x="88" y="100" width="14" height="30" rx="2" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="110" y="120" fill="#f59e0b" fontSize="8" fontFamily="monospace">R</text>
      <line x1="95" y1="130" x2="95" y2="155" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Pin */}
      <circle cx="95" cy="155" r="4" fill="#3b82f6" />
      <line x1="99" y1="155" x2="230" y2="155" stroke="#3b82f6" strokeWidth="2" />
      <text x="135" y="150" fill="#3b82f6" fontSize="9" fontFamily="monospace">PB0</text>
      {/* External button */}
      <rect x="245" y="140" width="60" height="30" rx="4" fill="#334155" stroke="#475569" strokeWidth="1" />
      <text x="257" y="160" fill="#94a3b8" fontSize="9" fontFamily="monospace">BTN</text>
      <line x1="230" y1="155" x2="245" y2="155" stroke="#3b82f6" strokeWidth="2" />
      <line x1="305" y1="155" x2="340" y2="155" stroke="#94a3b8" strokeWidth="2" />
      <text x="348" y="159" fill="#94a3b8" fontSize="10" fontFamily="monospace">GND</text>
      {/* Labels */}
      <text x="260" y="55" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">Button OPEN:</text>
      <text x="260" y="72" fill="#94a3b8" fontSize="9" fontFamily="monospace">Pull-up holds pin HIGH</text>
      <text x="260" y="86" fill="#94a3b8" fontSize="9" fontFamily="monospace">digitalRead → HIGH</text>
      <text x="260" y="105" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">Button PRESSED:</text>
      <text x="260" y="122" fill="#94a3b8" fontSize="9" fontFamily="monospace">Pin connected to GND</text>
      <text x="260" y="136" fill="#94a3b8" fontSize="9" fontFamily="monospace">digitalRead → LOW</text>
    </svg>
  ),
  circuit: () => (
    <svg viewBox="0 0 500 180" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="20" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">LED Circuit — Why the Resistor:</text>
      {/* PA0 */}
      <text x="20" y="65" fill="#3b82f6" fontSize="10" fontFamily="monospace" fontWeight="bold">PA0</text>
      <text x="20" y="78" fill="#475569" fontSize="8" fontFamily="monospace">3.3V out</text>
      <line x1="55" y1="60" x2="110" y2="60" stroke="#3b82f6" strokeWidth="2" />
      {/* Resistor */}
      <rect x="110" y="50" width="50" height="20" rx="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="122" y="64" fill="#f59e0b" fontSize="9" fontFamily="monospace">220Ω</text>
      <line x1="160" y1="60" x2="210" y2="60" stroke="#94a3b8" strokeWidth="2" />
      {/* LED */}
      <polygon points="210,46 210,74 240,60" fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <line x1="240" y1="46" x2="240" y2="74" stroke="#ef4444" strokeWidth="1.5" />
      <line x1="240" y1="60" x2="290" y2="60" stroke="#94a3b8" strokeWidth="2" />
      {/* GND */}
      <text x="298" y="64" fill="#94a3b8" fontSize="10" fontFamily="monospace">GND (0V)</text>
      {/* Math */}
      <text x="20" y="115" fill="#94a3b8" fontSize="10" fontFamily="monospace">Ohm's Law: R = V / I</text>
      <text x="20" y="132" fill="#94a3b8" fontSize="10" fontFamily="monospace">V across resistor = 3.3V - 2.0V (LED) = 1.3V</text>
      <text x="20" y="149" fill="#94a3b8" fontSize="10" fontFamily="monospace">R = 1.3V / 0.010A = 130Ω minimum</text>
      <text x="20" y="166" fill="#f59e0b" fontSize="10" fontFamily="monospace">We use 220Ω for safety margin</text>
    </svg>
  ),
  bounce: () => (
    <svg viewBox="0 0 500 200" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="20" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">What the MCU Sees When You Press a Button:</text>
      {/* Axes */}
      <line x1="60" y1="50" x2="60" y2="160" stroke="#475569" strokeWidth="1" />
      <line x1="60" y1="160" x2="480" y2="160" stroke="#475569" strokeWidth="1" />
      <text x="30" y="75" fill="#94a3b8" fontSize="9" fontFamily="monospace">HIGH</text>
      <text x="30" y="150" fill="#94a3b8" fontSize="9" fontFamily="monospace">LOW</text>
      <text x="250" y="180" fill="#475569" fontSize="9" fontFamily="monospace" textAnchor="middle">Time →</text>
      {/* Signal with bounce */}
      <polyline points="60,70 140,70 140,145 148,70 148,145 154,70 154,145 160,70 160,145 168,145 480,145" fill="none" stroke="#ef4444" strokeWidth="2" />
      {/* Annotations */}
      <line x1="140" y1="40" x2="140" y2="48" stroke="#f59e0b" strokeWidth="1" />
      <line x1="170" y1="40" x2="170" y2="48" stroke="#f59e0b" strokeWidth="1" />
      <line x1="140" y1="44" x2="170" y2="44" stroke="#f59e0b" strokeWidth="1" />
      <text x="155" y="38" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace">Bounce zone</text>
      <text x="155" y="195" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace">~5-20ms of chaos</text>
      <text x="80" y="62" fill="#10b981" fontSize="8" fontFamily="monospace">Not pressed</text>
      <text x="320" y="140" fill="#3b82f6" fontSize="8" fontFamily="monospace">Settled — actually pressed</text>
    </svg>
  ),
  edge: () => (
    <svg viewBox="0 0 500 180" style={{ width: "100%", maxWidth: 500 }}>
      <text x="20" y="20" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">Edge Detection — What We React To:</text>
      {/* Signal */}
      <line x1="50" y1="60" x2="50" y2="140" stroke="#475569" strokeWidth="1" />
      <text x="25" y="75" fill="#94a3b8" fontSize="8" fontFamily="monospace">HIGH</text>
      <text x="25" y="135" fill="#94a3b8" fontSize="8" fontFamily="monospace">LOW</text>
      <polyline points="50,70 160,70 160,130 300,130 300,70 420,70 420,130 480,130" fill="none" stroke="#3b82f6" strokeWidth="2" />
      {/* Falling edge markers */}
      <circle cx="160" cy="100" r="12" fill="none" stroke="#10b981" strokeWidth="2" />
      <text x="160" y="104" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace">✓</text>
      <text x="160" y="160" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace">FALLING</text>
      <text x="160" y="172" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace">Toggle here!</text>
      <circle cx="420" cy="100" r="12" fill="none" stroke="#10b981" strokeWidth="2" />
      <text x="420" y="104" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace">✓</text>
      <text x="420" y="160" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace">FALLING</text>
      <text x="420" y="172" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace">Toggle here!</text>
      {/* Rising edge markers */}
      <circle cx="300" cy="100" r="12" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <text x="300" y="104" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace" opacity="0.5">✗</text>
      <text x="300" y="160" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace" opacity="0.5">RISING</text>
      <text x="300" y="172" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" opacity="0.5">Ignore</text>
    </svg>
  )
};

/* ── CODE BLOCK COMPONENT ── */
function CodeBlock({ codeData }) {
  const [revealedLines, setRevealedLines] = useState(0);
  const [expandedLine, setExpandedLine] = useState(null);

  const codeLines = codeData.lines;
  const totalLines = codeLines.length;
  const allRevealed = revealedLines >= totalLines;

  const revealNext = () => {
    let next = revealedLines + 1;
    while (next < totalLines && codeLines[next].code === '' && codeLines[next].explanation === null) {
      next++;
    }
    setRevealedLines(Math.min(next, totalLines));
    setExpandedLine(next - 1);
  };

  const revealAll = () => {
    setRevealedLines(totalLines);
    setExpandedLine(null);
  };

  return (
    <div style={{ margin: "20px 0", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      <div style={{ background: "#0f172a", padding: "4px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b" }}>
        <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>sketch.ino</span>
        <div style={{ display: "flex", gap: 8 }}>
          {!allRevealed && (
            <>
              <button onClick={revealNext} style={{ background: "#f59e0b", color: "#0f172a", border: "none", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}>
                Next Line →
              </button>
              <button onClick={revealAll} style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", padding: "4px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>
                Show All
              </button>
            </>
          )}
          {allRevealed && <span style={{ color: "#10b981", fontSize: 12, fontFamily: "monospace" }}>✓ Complete</span>}
        </div>
      </div>
      <div style={{ background: "#0a0e1a", padding: "12px 0", fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace", fontSize: 13, lineHeight: "1.7", overflowX: "auto" }}>
        {codeLines.slice(0, revealedLines).map((line, i) => (
          <div key={i}>
            <div
              onClick={() => line.explanation ? setExpandedLine(expandedLine === i ? null : i) : null}
              style={{
                padding: "1px 16px",
                background: expandedLine === i && line.explanation ? "#1e293b" : "transparent",
                cursor: line.explanation ? "pointer" : "default",
                borderLeft: expandedLine === i && line.explanation ? "3px solid #f59e0b" : "3px solid transparent",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ color: "#334155", fontSize: 11, marginRight: 12, userSelect: "none", display: "inline-block", width: 20, textAlign: "right" }}>{i + 1}</span>
              <span style={{ color: line.code.startsWith('//') || line.code.startsWith('  //') ? "#475569" : line.code.includes('#define') ? "#c084fc" : line.code.includes('void ') ? "#3b82f6" : "#e2e8f0" }}>
                {line.code || '\u00A0'}
              </span>
              {line.explanation && <span style={{ color: "#f59e0b", fontSize: 10, marginLeft: 8, opacity: 0.6 }}>●</span>}
            </div>
            {expandedLine === i && line.explanation && (
              <div style={{ padding: "8px 16px 8px 52px", background: "#141c2e", borderLeft: "3px solid #f59e0b", color: "#cbd5e1", fontSize: 12, lineHeight: 1.6, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                💡 {line.explanation}
              </div>
            )}
          </div>
        ))}
        {!allRevealed && revealedLines < totalLines && (
          <div style={{ padding: "4px 16px", color: "#334155", fontSize: 12, fontStyle: "italic" }}>
            ... {totalLines - revealedLines} more line{totalLines - revealedLines > 1 ? 's' : ''} — click "Next Line"
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function EmbeddedWizard() {
  const [currentProject, setCurrentProject] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  const project = PROJECTS[currentProject];
  const step = project.steps[currentStep];
  const totalSteps = project.steps.length;
  const isFirstStep = currentStep === 0 && currentProject === 0;
  const isLastStep = currentStep === totalSteps - 1 && currentProject === PROJECTS.length - 1;

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentProject, currentStep]);

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentProject < PROJECTS.length - 1) {
      setCurrentProject(currentProject + 1);
      setCurrentStep(0);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentProject > 0) {
      setCurrentProject(currentProject - 1);
      setCurrentStep(PROJECTS[currentProject - 1].steps.length - 1);
    }
  };

  const globalStepIndex = PROJECTS.slice(0, currentProject).reduce((acc, p) => acc + p.steps.length, 0) + currentStep;
  const totalGlobalSteps = PROJECTS.reduce((acc, p) => acc + p.steps.length, 0);
  const progressPercent = ((globalStepIndex + 1) / totalGlobalSteps) * 100;

  const VisualComponent = step.visual ? Visuals[step.visual] : null;

  const renderContent = (text) => {
    return text.split('\n\n').map((para, i) => (
      <p key={i} style={{ margin: "0 0 16px 0", lineHeight: 1.75 }}>
        {para.split(/(\*\*.*?\*\*)/).map((segment, j) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={j} style={{ color: "#f1f5f9", fontWeight: 600 }}>{segment.slice(2, -2)}</strong>;
          }
          return <span key={j}>{segment}</span>;
        })}
      </p>
    ));
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0c1222", color: "#94a3b8", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* ── TOP BAR ── */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: "monospace", letterSpacing: -0.5 }}>⚡ EMBEDDED</span>
            <span style={{ fontSize: 13, color: "#475569", fontFamily: "monospace" }}>Learning Wizard</span>
          </div>
          <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>
            {globalStepIndex + 1} / {totalGlobalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#1e293b" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, #f59e0b, ${project.color})`, width: `${progressPercent}%`, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* ── PROJECT TABS ── */}
      <div style={{ display: "flex", gap: 0, background: "#0f172a", borderBottom: "1px solid #1e293b", flexShrink: 0, overflowX: "auto" }}>
        {PROJECTS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setCurrentProject(i); setCurrentStep(0); }}
            style={{
              flex: "1 1 0",
              padding: "12px 16px",
              background: i === currentProject ? "#0c1222" : "transparent",
              border: "none",
              borderBottom: i === currentProject ? `2px solid ${p.color}` : "2px solid transparent",
              color: i === currentProject ? p.color : "#475569",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: i === currentProject ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 14 }}>P{p.id}</span>
            <span style={{ marginLeft: 6 }}>{p.title}</span>
          </button>
        ))}
      </div>

      {/* ── STEP DOTS ── */}
      <div style={{ display: "flex", gap: 6, padding: "12px 20px", background: "#0c1222", flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
        {project.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            title={s.title}
            style={{
              width: i === currentStep ? "auto" : 28,
              height: 28,
              borderRadius: 14,
              border: `1.5px solid ${i === currentStep ? project.color : i < currentStep ? project.color + "60" : "#1e293b"}`,
              background: i < currentStep ? project.color + "20" : i === currentStep ? project.color + "15" : "transparent",
              color: i === currentStep ? project.color : i < currentStep ? project.color : "#334155",
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: i === currentStep ? "0 12px" : 0,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {i === currentStep ? `${i + 1}. ${s.title}` : i < currentStep ? "✓" : i + 1}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Step header */}
          <div style={{ margin: "24px 0 20px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", lineHeight: 1.3 }}>{step.title}</h2>
            <span style={{ fontSize: 12, color: project.color, fontFamily: "monospace" }}>{project.title} — Step {currentStep + 1} of {totalSteps}</span>
          </div>

          {/* Main content */}
          <div style={{ fontSize: 14.5, lineHeight: 1.75, color: "#94a3b8" }}>
            {renderContent(step.content)}
          </div>

          {/* Visual */}
          {VisualComponent && (
            <div style={{ margin: "24px 0", padding: 20, background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
              <VisualComponent />
            </div>
          )}

          {/* Code block */}
          {step.code && <CodeBlock codeData={step.code} key={`${currentProject}-${currentStep}`} />}

          {/* Takeaway */}
          {step.takeaway && (
            <div style={{
              margin: "24px 0",
              padding: "16px 20px",
              background: "#14251a",
              borderRadius: 8,
              border: "1px solid #166534",
              borderLeft: "4px solid #10b981"
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 6, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>Key Takeaway</div>
              <div style={{ fontSize: 14, color: "#86efac", lineHeight: 1.6 }}>{step.takeaway}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ flexShrink: 0, padding: "12px 20px", background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={goPrev}
          disabled={isFirstStep}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            border: "1px solid #1e293b",
            background: isFirstStep ? "transparent" : "#1e293b",
            color: isFirstStep ? "#334155" : "#94a3b8",
            fontSize: 13,
            fontFamily: "monospace",
            cursor: isFirstStep ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>
          {currentStep < totalSteps - 1 ? "Next step" : currentProject < PROJECTS.length - 1 ? "Next project →" : "🎉 Complete!"}
        </span>
        <button
          onClick={goNext}
          disabled={isLastStep}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            border: "none",
            background: isLastStep ? "#1e293b" : project.color,
            color: isLastStep ? "#334155" : "#0f172a",
            fontSize: 13,
            fontFamily: "monospace",
            cursor: isLastStep ? "default" : "pointer",
            fontWeight: 700,
          }}
        >
          {currentStep < totalSteps - 1 ? "Continue →" : currentProject < PROJECTS.length - 1 ? "Start Project " + (currentProject + 2) + " →" : "Done ✓"}
        </button>
      </div>
    </div>
  );
}
