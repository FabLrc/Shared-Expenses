-- CreateIndex
CREATE INDEX "ExpenseSession_creatorId_idx" ON "ExpenseSession"("creatorId");

-- CreateIndex
CREATE INDEX "ExpenseSession_inviteeId_idx" ON "ExpenseSession"("inviteeId");

-- CreateIndex
CREATE INDEX "Expense_sessionId_idx" ON "Expense"("sessionId");

-- CreateIndex
CREATE INDEX "Expense_addedById_idx" ON "Expense"("addedById");
