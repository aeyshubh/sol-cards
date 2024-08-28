class Card {
    constructor(value, suit) {
      this.value = value;
      this.suit = suit;
    }
  
    get numericValue() {
      if (['Jack', 'Queen', 'King'].includes(this.value)) return 10;
      if (this.value === 'Ace') return 11;
      return parseInt(this.value);
    }
  
    toString() {
      return `${this.value} of ${this.suit}`;
    }
  }
  
  class Deck {
    constructor() {
      this.cards = [];
      const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
      const values = [
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        'Jack',
        'Queen',
        'King',
        'Ace',
      ];
  
      for (let suit of suits) {
        for (let value of values) {
          this.cards.push(new Card(value, suit));
        }
      }
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
  
  class MultiDeck {
    constructor(numberOfDecks) {
      this.cards = [];
      for (let i = 0; i < numberOfDecks; i++) {
        const deck = new Deck();
        this.cards = this.cards.concat(deck.cards);
      }
      this.shuffle();
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
  
  class Player {
    constructor(name) {
      this.name = name;
      this.hand = [];
    }
  
    addCard(card) {
      this.hand.push(card);
    }
  
    getHandValue() {
      return this.hand.reduce((sum, card) => sum + card.numericValue, 0);
    }
  
    getHandString() {
      return this.hand.map(card => card.toString()).join(', ');
    }
  }
  
  export function playDealerGame() {
    const multiDeck = new MultiDeck(3); // Using 3 decks
    const dealer = new Player('Dealer');
   // Deal 3 cards to each player
   for (let i = 0; i < 3; i++) {
    dealer.addCard(multiDeck.draw());
  }

  let dealerhand = dealer.getHandString()
  let dealerValue = dealer.getHandValue();
  return({value:dealerValue,cards:dealerhand});
  }

  export function playUserGame() {
    const multiDeck = new MultiDeck(3); // Using 3 decks
    const player = new Player('Player');
  
    // Deal 3 cards to each player
    for (let i = 0; i < 3; i++) {
      player.addCard(multiDeck.draw());
    }
  
    let playerhand = player.getHandString(); 
   let playerValue = player.getHandValue();

   return({value:playerValue,cards:playerhand});

    }
  
    export function getResult(playerValue,dealerValue){
      let cardStatus;
   if (playerValue > 21 && dealerValue > 21) {
     cardStatus = "Both bust! It's a tie.";
   } else if (playerValue > 21) {
     cardStatus = "Player busts! Dealer wins.";
   } else if (dealerValue > 21) {
     cardStatus = "Dealer busts! Player wins.";
   } else if (playerValue > dealerValue) {
     cardStatus = "Player wins!";
   } else if (dealerValue > playerValue) {
     cardStatus = "Dealer wins!";
   } else {
     cardStatus = "It's a tie!";
   }
   return cardStatus;
    }
  
  // Play the game
  

  