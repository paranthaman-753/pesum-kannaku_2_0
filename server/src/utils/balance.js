// Balance rules live here, in plain code. The AI never calculates balances.
//   outstanding = total credit - total payments

export function round2(value) {
  return Math.round(value * 100) / 100;
}

export function calculateBalance(transactions) {
  let totalCredit = 0;
  let totalPayment = 0;

  for (const tx of transactions) {
    if (tx.type === 'credit') totalCredit += tx.amount;
    else if (tx.type === 'payment') totalPayment += tx.amount;
  }

  return {
    totalCredit: round2(totalCredit),
    totalPayment: round2(totalPayment),
    outstanding: round2(totalCredit - totalPayment)
  };
}
