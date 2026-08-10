"use client";

import { FormEvent, useMemo, useState } from "react";
import { createExpense } from "../lib/api";

type Expense = {
  id: number;
  title: string;
  category: string;
  payer: string;
  amount: number;
  date: string;
};

const initialExpenses: Expense[] = [
  { id: 1, title: "Dinner at Otto's", category: "Dining", payer: "You", amount: 84, date: "Today" },
  { id: 2, title: "Groceries", category: "Home", payer: "Aarav", amount: 56.4, date: "Yesterday" },
  { id: 3, title: "Airport cab", category: "Travel", payer: "Meera", amount: 32, date: "Aug 4" }
];

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function Home() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("Using local sample data — connect your API when it is ready.");
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "Untitled expense");
    const amount = Number(data.get("amount"));
    const payer = String(data.get("payer") || "You");

    if (!Number.isFinite(amount) || amount <= 0) return;

    try {
      await createExpense({ title, amount, payer, splitType: "equal" });
      setNotice(process.env.NEXT_PUBLIC_API_URL ? "Expense sent to your API." : "Expense added locally. Set NEXT_PUBLIC_API_URL when your API is ready.");
      setExpenses((current) => [
        { id: Date.now(), title, category: "General", payer, amount, date: "Just now" },
        ...current
      ]);
      setShowForm(false);
      event.currentTarget.reset();
    } catch {
      setNotice("Your API did not accept the expense. The sample data was left unchanged.");
    }
  }

  return (
    <main>
      <aside className="sidebar">
        <a className="brand" href="#top"><span>✦</span> SmartSplit</a>
        <nav>
          <a className="active" href="#overview">Overview</a>
          <a href="#expenses">Expenses</a>
          <a href="#settle">Settle up</a>
          <a href="#groups">Groups</a>
        </nav>
        <div className="profile"><div className="avatar">PS</div><span>Parth</span><small>⌄</small></div>
      </aside>

      <section className="content" id="top">
        <header>
          <div><p className="eyebrow">GOOD MORNING, PARTH</p><h1>Here’s your shared spending.</h1></div>
          <button className="primary" onClick={() => setShowForm(true)}>＋ Add expense</button>
        </header>

        <div className="notice">● {notice}</div>

        <section className="summary" id="overview">
          <article className="balance-card"><p>Total group spending</p><strong>{currency.format(total)}</strong><span>↑ 12% from last month</span></article>
          <article className="balance-card positive"><p>You are owed</p><strong>{currency.format(26.8)}</strong><span>from 2 people</span></article>
          <article className="balance-card negative"><p>You owe</p><strong>{currency.format(14)}</strong><span>to Aarav</span></article>
        </section>

        <section className="grid">
          <article className="panel" id="expenses">
            <div className="panel-title"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Expenses</h2></div><button className="link-button" onClick={() => setShowForm(true)}>Add new</button></div>
            <div className="expense-list">
              {expenses.map((expense) => <div className="expense" key={expense.id}>
                <div className="expense-icon">{expense.category === "Dining" ? "🍜" : expense.category === "Travel" ? "🚕" : "🛒"}</div>
                <div className="expense-name"><b>{expense.title}</b><span>{expense.date} · Paid by {expense.payer}</span></div>
                <div className="expense-amount"><b>{currency.format(expense.amount)}</b><span>{expense.payer === "You" ? "You paid" : "You owe $8.00"}</span></div>
              </div>)}
            </div>
          </article>

          <article className="panel settle" id="settle">
            <p className="eyebrow">SETTLEMENTS</p><h2>Keep it simple.</h2>
            <p className="muted">One payment settles your open balances for the Weekend in Goa group.</p>
            <div className="settlement"><div className="avatar orange">A</div><div><b>Aarav</b><span>You owe</span></div><strong>{currency.format(14)}</strong></div>
            <button className="dark-button" onClick={() => setNotice("Settlement marked locally. Connect this button to POST /settlements.")}>Settle up</button>
          </article>
        </section>

        <section className="groups" id="groups"><div><p className="eyebrow">YOUR GROUPS</p><h2>Active groups</h2></div><div className="group-card"><span className="group-icon">🌴</span><div><b>Weekend in Goa</b><small>4 members · 12 expenses</small></div><em>You are owed $12.80</em></div><div className="group-card"><span className="group-icon">🏠</span><div><b>Apartment 7B</b><small>3 members · 8 expenses</small></div><em className="owe">You owe $14.00</em></div></section>
      </section>

      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
        <form className="modal" onSubmit={addExpense} onMouseDown={(event) => event.stopPropagation()}>
          <button className="close" type="button" onClick={() => setShowForm(false)}>×</button>
          <p className="eyebrow">NEW EXPENSE</p><h2>Add an expense</h2>
          <label>Description<input name="title" placeholder="e.g. Dinner at Otto's" required /></label>
          <label>Amount<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
          <label>Paid by<select name="payer"><option>You</option><option>Aarav</option><option>Meera</option></select></label>
          <button className="primary" type="submit">Save expense</button>
        </form>
      </div>}
    </main>
  );
}
