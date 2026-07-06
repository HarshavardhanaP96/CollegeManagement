import React from 'react';
import { Badge } from '../Badge';

export function StudentWallet() {
  const receipts = [
    {id:"RC-9821", desc:"Tuition · Installment 1", date:"2026-01-10", method:"Card · Visa 4242", amount:"$2,400"},
    {id:"RC-9822", desc:"Library Levy", date:"2026-01-10", method:"Card · Visa 4242", amount:"$200"},
    {id:"RC-9920", desc:"Tuition · Installment 2", date:"2026-04-04", method:"Bank Transfer", amount:"$2,400"},
    {id:"RC-9981", desc:"Lab Fees", date:"2026-04-04", method:"Bank Transfer", amount:"$600"},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          Download all receipts
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Payment history, receipts and upcoming charges</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Paid · This Term</p>
          <p className="text-3xl font-bold text-gray-900">$5,600</p>
          <p className="text-sm mt-1 text-gray-400">100%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Outstanding</p>
          <p className="text-3xl font-bold text-gray-900">$0</p>
          <p className="text-sm mt-1 text-emerald-600 font-medium">All clear</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Next Due</p>
          <p className="text-3xl font-bold text-gray-900">Sep 15</p>
          <p className="text-sm mt-1 text-gray-400">Installment 1 · Fall</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Saved Method</p>
          <p className="text-gray-200 font-mono text-sm mb-1">•••• 4242 <span className="ml-4 text-gray-500 text-xs">VISA</span></p>
          <p className="text-xs text-gray-500 mb-3">Julianne Sterling · Exp 04/29</p>
          <button className="w-full text-xs font-semibold text-gray-400 border border-gray-700 rounded-lg py-2 hover:bg-gray-800 transition-colors">
            Manage payment methods
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Receipts</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["Receipt","Description","Date","Method","Amount","Status"].map(h=>(
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipts.map(r=>(
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{r.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{r.desc}</td>
                <td className="py-3 px-4 text-gray-400 font-mono text-xs">{r.date}</td>
                <td className="py-3 px-4 text-gray-600">{r.method}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{r.amount}</td>
                <td className="py-3 px-4">
                  <Badge color="green">Paid</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}