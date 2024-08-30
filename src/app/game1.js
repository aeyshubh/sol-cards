export class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
  }

  get numericValue() {
    if (["Jack", "Queen", "King"].includes(this.value)) return 10;
    if (this.value === "Ace") return 11;
    return parseInt(this.value);
  }

  toString() {
    return `${this.value} of ${this.suit}`;
  }
}

class MultiDeck {
  constructor(numberOfDecks = 3) {
    this.cards = this.createDecks(numberOfDecks);
    this.shuffle();
  }

  createDecks(numberOfDecks) {
    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];

    const values = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "Jack",
      "Queen",
      "King",
      "Ace",
    ];
    let cards = [];

    for (let i = 0; i < numberOfDecks; i++) {
      for (let suit of suits) {
        for (let value of values) {
          cards.push(new Card(value, suit));
        }
      }
    }

    return cards;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }
}

export function getDealerCard() {
  const deck = new MultiDeck();
  const card = deck.draw();

  let valueAbbreviation;
  if (["Jack", "Queen", "King", "Ace"].includes(card.value)) {
    valueAbbreviation = card.value[0];
  } else {
    valueAbbreviation = card.value;
  }

  let suitAbbreviation;
  if (card.suit === "Spades") {
    suitAbbreviation = "S";
  } else if (card.suit === "Hearts") {
    suitAbbreviation = "H";
  } else if (card.suit === "Diamonds") {
    suitAbbreviation = "D";
  } else {
    suitAbbreviation = "C";
  }

  let card_face = `${valueAbbreviation}${suitAbbreviation}`;
  let stringCard = card.toString();

  console.log(`Dealer's card: ${card.toString()}`);
  console.log(`Dealer's value: ${card.numericValue}`);
  console.log(`Dealer's card face: ${card_face}`);

  return { card: stringCard, value: card.numericValue, card_face: card_face };
}

export function getUserCard() {
  const deck = new MultiDeck();
  const card = deck.draw();
  console.log("card", card);
  let valueAbbreviation;
  if (["Jack", "Queen", "King", "Ace"].includes(card.value)) {
    valueAbbreviation = card.value[0];
  } else {
    valueAbbreviation = card.value;
  }

  let suitAbbreviation;
  if (card.suit === "Spades") {
    suitAbbreviation = "S";
  } else if (card.suit === "Hearts") {
    suitAbbreviation = "H";
  } else if (card.suit === "Diamonds") {
    suitAbbreviation = "D";
  } else {
    suitAbbreviation = "C";
  }

  let card_face = `${valueAbbreviation}${suitAbbreviation}`;
  let stringCard = card.toString();
  console.log(`Your card: ${card.toString()}`);
  console.log(`Your value: ${card.value}`);
  return { card: stringCard, value: card.numericValue, card_face: card_face };
}

export function determineWinner(userCard, dealerCard, type) {
  // Convert the card values inside the determineWinner function
  const getCardNumericValue = (card) => {
    if (card.value === "Jack") return 11;
    if (card.value === "Queen") return 12;
    if (card.value === "King") return 13;
    if (card.value === "Ace") return 14;
    return parseInt(card.value); // For values 2-10
  };

  const userCardValue = getCardNumericValue(userCard);
  const dealerCardValue = getCardNumericValue(dealerCard);

  if (type === "high") {
    if (userCardValue > dealerCardValue) {
      console.log("You win!");
      return 1;
    } else if (dealerCardValue > userCardValue) {
      console.log("Dealer wins!");
      return 2;
    } else {
      console.log("It's a tie!");
      return 3;
    }
  } else if (type === "low") {
    if (userCardValue < dealerCardValue) {
      console.log("You win!");
      return 1;
    } else if (dealerCardValue < userCardValue) {
      console.log("Dealer wins!");
      return 2;
    } else {
      console.log("It's a tie!");
      return 3;
    }
  } else {
    throw new Error(`Unknown game type: ${type}`);
  }
}

/* const userCard = getUserCard();
    const dealerCard = getDealerCard();
  console.log("User cards",userCard,"Dealer Card",dealerCard)
    determineWinner(userCard, dealerCard); */

export const getCardAbbreviation = (card) => {
  let valueAbbreviation;

  // Get the value abbreviation
  if (["Jack", "Queen", "King", "Ace"].includes(card.value)) {
    valueAbbreviation = card.value[0]; // Take the first letter for face cards and Ace
  } else {
    valueAbbreviation = card.value; // Use the numeric value as it is
  }

  let suitAbbreviation;

  // Get the suit abbreviation
  switch (card.suit) {
    case "Hearts":
      suitAbbreviation = "H";
      break;
    case "Diamonds":
      suitAbbreviation = "D";
      break;
    case "Clubs":
      suitAbbreviation = "C";
      break;
    case "Spades":
      suitAbbreviation = "S";
      break;
    default:
      throw new Error("Unknown suit: " + card.suit);
  }

  // Combine the value and suit abbreviations
  return `${valueAbbreviation}${suitAbbreviation}`;
};

export const getCardAbbreviationsFromUrl = (url) => {
  // Extract the 'card' parameter from the URL
  const urlParams = new URLSearchParams(url.split("?")[1]);
  const cardsString = urlParams.get("card"); // e.g., "5 of Diamonds, 9 of Diamonds, 8 of Diamonds"

  // Split the cards by comma and trim any extra spaces
  const cardsArray = cardsString.split(",").map((card) => card.trim());

  // Helper function to convert a single card string to abbreviation
  const convertToAbbreviation = (cardString) => {
    const [value, , suit] = cardString.split(" "); // Split by space, ignoring "of"
    const card = new Card(value, suit); // Create a Card object
    return getCardAbbreviation(card); // Get the abbreviation
  };

  // Convert each card to its abbreviation
  const abbreviations = cardsArray.map(convertToAbbreviation);

  // Join the abbreviations with a comma
  return abbreviations.join(", ");
};
