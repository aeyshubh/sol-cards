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
  
  class MultiDeck {
    constructor(numberOfDecks = 3) {
      this.cards = this.createDecks(numberOfDecks);
      this.shuffle();
    }
  
    createDecks(numberOfDecks) {
      const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
      const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
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
    console.log(`Dealer's card: ${card.toString()}`);
    console.log(`Dealer's value: ${card.numericValue}`);
    return card;
  }
  
  export function getUserCard() {
   const deck = new MultiDeck(); 
    const card = deck.draw();
    let stringCard = card.toString();
    console.log(`Your card: ${card.toString()}`);
    console.log(`Your value: ${card.value}`);
    return ({card:stringCard,value:card.numericValue});
  }
  
  export function determineWinner(userCard, dealerCard,type) {
    if(type =='high'){//High
    if (userCard > dealerCard.numericValue) {
      console.log("You win!");
      return 1;
    } else if (dealerCard.numericValue > userCard) {
      console.log("Dealer wins!");
      return 2;
    } else {
      console.log("It's a tie!");
      return 3;
  }
}else{ //low
    if (userCard < dealerCard.numericValue) {
        console.log("You win!");
        return 1;
      } else if (dealerCard.numericValue < userCard) {
        console.log("Dealer wins!");
        return 2;
      } else {
        console.log("It's a tie!");
        return 3;
    }
}
  }
    /* const userCard = getUserCard();
    const dealerCard = getDealerCard();
  console.log("User cards",userCard,"Dealer Card",dealerCard)
    determineWinner(userCard, dealerCard); */
  
  