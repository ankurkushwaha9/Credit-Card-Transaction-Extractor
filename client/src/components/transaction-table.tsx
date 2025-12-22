import { ArrowUpDown, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Transaction } from "@shared/schema";

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortField = "date" | "details" | "amount";
type SortDirection = "asc" | "desc";

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;
    if (sortField === "date") {
      comparison = a.date.localeCompare(b.date);
    } else if (sortField === "details") {
      comparison = a.details.localeCompare(b.details);
    } else if (sortField === "amount") {
      comparison = a.amount - b.amount;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : formatted;
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium">No transactions found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The statement appears to be empty or couldn't be parsed.
          </p>
        </div>
      </Card>
    );
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium"
      onClick={() => handleSort(field)}
      data-testid={`button-sort-${field}`}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[140px]">
                <SortButton field="date">Date</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="details">Transaction Details</SortButton>
              </TableHead>
              <TableHead className="w-[140px] text-right">
                <SortButton field="amount">Amount (USD)</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction, index) => (
              <TableRow
                key={transaction.id}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                data-testid={`row-transaction-${transaction.id}`}
              >
                <TableCell className="font-mono text-sm" data-testid={`text-date-${transaction.id}`}>
                  {transaction.date}
                </TableCell>
                <TableCell data-testid={`text-details-${transaction.id}`}>
                  {transaction.details}
                </TableCell>
                <TableCell
                  className={`text-right font-mono tabular-nums ${
                    transaction.amount < 0 ? "text-destructive" : ""
                  }`}
                  data-testid={`text-amount-${transaction.id}`}
                >
                  {formatAmount(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {sortedTransactions.map((transaction) => (
          <Card
            key={transaction.id}
            className="p-4"
            data-testid={`card-transaction-${transaction.id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate" data-testid={`text-mobile-details-${transaction.id}`}>
                  {transaction.details}
                </p>
                <p className="mt-1 text-sm text-muted-foreground font-mono" data-testid={`text-mobile-date-${transaction.id}`}>
                  {transaction.date}
                </p>
              </div>
              <p
                className={`flex-shrink-0 font-mono font-medium tabular-nums ${
                  transaction.amount < 0 ? "text-destructive" : ""
                }`}
                data-testid={`text-mobile-amount-${transaction.id}`}
              >
                {formatAmount(transaction.amount)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span data-testid="text-transaction-count">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </span>
        <span className="font-mono tabular-nums" data-testid="text-total-amount">
          Total: {formatAmount(transactions.reduce((sum, t) => sum + t.amount, 0))}
        </span>
      </div>
    </div>
  );
}
