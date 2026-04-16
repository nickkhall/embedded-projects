#define RED_LED PA0
#define YELLOW_LED PA1
#define GREEN_LED PA2
#define PED_BUTTON PB12
#define ANODE_A PB0
#define ANODE_B PB1
#define ANODE_C PB3
#define ANODE_D PB4
#define ANODE_E PB5
#define ANODE_F PB6
#define ANODE_G PB7

typedef enum TrafficState {
  RED,
  YELLOW,
  GREEN,
  PED_CROSSING_COUNTDOWN,
  PED_CROSSING,
} TrafficState;

TrafficState currentState = RED;

unsigned long stateStartTime = 0;
const unsigned long RED_TIME = 5000;
const unsigned long YELLOW_TIME = 2000;
const unsigned long GREEN_TIME = 5000;
const unsigned long PED_CROSSING_COUNTDOWN_TIME = 6020;
const unsigned long PED_CROSSING_TIME = 5000;

int countdownValue = 5;
unsigned long lastCountTime = 0;
bool lastButtonState = HIGH;

const int segPins[7] = {
  ANODE_A,
  ANODE_B,
  ANODE_C,
  ANODE_D,
  ANODE_E,
  ANODE_F,
  ANODE_G,
};
//                        a,   b,   c,   d,   e,   f,   g

const bool digits[6][7] = {
  { 1, 1, 1, 1, 1, 1, 0 }, // 0
  { 0, 1, 1, 0, 0, 0, 0 }, // 1
  { 1, 1, 0, 1, 1, 0, 1 }, // 2
  { 1, 1, 1, 1, 0, 0, 1 }, // 3
  { 0, 1, 1, 0, 0, 1, 1 }, // 4
  { 1, 0, 1, 1, 0, 1, 1 }, // 5
};

bool buttonPressed() {
  bool current = digitalRead(PED_BUTTON);
  bool pressed = (current == LOW && lastButtonState == HIGH);
  
  lastButtonState = current;
  return pressed;
}

void displayDigit(int num) {
  for (int i = 0; i < 7; i++) {
    digitalWrite(segPins[i], digits[num][i]);
  }
}

void clearDigit() {
  for (int i = 0; i < 7; i++) {
    digitalWrite(segPins[i], LOW);
  }
}

void setLights(bool green, bool yellow, bool red) {
  digitalWrite(RED_LED, red);
  digitalWrite(YELLOW_LED, yellow);
  digitalWrite(GREEN_LED, green);
}

void setup() {
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(PED_BUTTON, INPUT_PULLUP);

  for (int i = 0; i < 7; i++) {
    pinMode(segPins[i], OUTPUT);
  }

  Serial.begin(9600);
}

void loop() {
  switch (currentState) {
    case PED_CROSSING_COUNTDOWN:
      setLights(true, false, false);
      if (millis() - lastCountTime > 1000) {
        countdownValue--;
        displayDigit(countdownValue);
        lastCountTime = millis();

        if (countdownValue < 0) {
          clearDigit();
          currentState = YELLOW;
          stateStartTime = millis();
        }
      }

    break;

    case GREEN:
      clearDigit();
      setLights(true, false, false);

      if (buttonPressed()) {
        currentState = PED_CROSSING_COUNTDOWN;
        countdownValue = 5;
        displayDigit(5);
        lastCountTime = millis();
      } else if (millis() - stateStartTime > GREEN_TIME) {
        currentState = YELLOW;
        stateStartTime = millis();
      }

      break;

    case YELLOW:
      setLights(false, true, false);
      clearDigit();

      if (millis() - stateStartTime > YELLOW_TIME) {
        currentState = RED;
        stateStartTime = millis();
      }

      break;

    case RED:
      setLights(false, false, true);
      clearDigit();
      
      if (millis() - stateStartTime > RED_TIME) {
        currentState = GREEN;
        stateStartTime = millis();
        setLights(true, false, false);
      }

      break;
    }

  delay(1);
}
