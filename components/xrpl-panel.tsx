"use client"

import type { XrplTransaction } from "@/lib/xrpl"
import { formatXrpAmount, rippleEpochToDate } from "@/lib/xrpl-utils"

interface XrplPanelProps {
  transaction: XrplTransaction | null
  ledgerInfo?: { ledger_index: number; close_time_human?: string } | null
  txHash?: string | null
}

export function XrplPanel({ transaction, ledgerInfo, txHash }: XrplPanelProps) {
  return (
    <div className="border border-blue-900/50 rounded bg-[#0a0f1a] p-4 text-xs font-mono">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">XRPL Testnet — Live Data</span>
      </div>

      {ledgerInfo && (
        <div className="mb-3 text-gray-500 border-b border-[#1a2a3a] pb-2">
          <span className="text-gray-600">Ledger</span>{" "}
          <span className="text-gray-300">#{ledgerInfo.ledger_index.toLocaleString()}</span>
        </div>
      )}

      {transaction ? (
        <div className="space-y-1.5">
          <div className="text-gray-600 uppercase text-[10px] tracking-widest mb-2">Escrow Transaction Reference</div>
          <Row label="Type" value={transaction.TransactionType} highlight />
          <Row label="Hash" value={`${transaction.hash.slice(0, 20)}...`} />
          <Row label="Account" value={`${transaction.Account.slice(0, 16)}...`} />
          {transaction.Destination && (
            <Row label="Destination" value={`${transaction.Destination.slice(0, 16)}...`} />
          )}
          {transaction.Amount && typeof transaction.Amount === "string" && (
            <Row label="Amount" value={formatXrpAmount(transaction.Amount)} highlight />
          )}
          {transaction.date && (
            <Row label="Date" value={rippleEpochToDate(transaction.date).toISOString().split("T")[0]} />
          )}
          {transaction.meta && (
            <Row
              label="Result"
              value={transaction.meta.TransactionResult}
              highlight={transaction.meta.TransactionResult === "tesSUCCESS"}
            />
          )}
        </div>
      ) : txHash ? (
        <div className="text-gray-500">
          <div className="text-gray-600 uppercase text-[10px] tracking-widest mb-2">Sample Transaction</div>
          <Row label="Hash" value={`${txHash.slice(0, 20)}...`} />
          <div className="mt-2 text-gray-600 text-[10px]">Live data unavailable — Testnet connection required</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="text-gray-600 uppercase text-[10px] tracking-widest mb-2">Testnet Context</div>
          <div className="text-gray-500 text-[11px] leading-relaxed">
            This challenge uses XRPL Testnet escrow primitives.{" "}
            <span className="text-blue-400">EscrowCreate</span>,{" "}
            <span className="text-blue-400">EscrowFinish</span>, and{" "}
            <span className="text-blue-400">EscrowCancel</span>{" "}
            are the on-chain transaction types used in your solution.
          </div>
          <div className="mt-3 border-t border-[#1a2a3a] pt-2 text-[10px] text-gray-600">
            Network: <span className="text-gray-400">s.altnet.rippletest.net</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-600 w-20 shrink-0">{label}</span>
      <span className={highlight ? "text-blue-300" : "text-gray-300"}>{value}</span>
    </div>
  )
}
