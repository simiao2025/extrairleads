# Leads Page Campaign & Niche Filters Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Implement server-side Campaign and Niche filters on the `/leads` page to allow seamless filtering of leads.

**Architecture:** Use search parameters in the Next.js page controller to query and filter leads server-side using Drizzle ORM, then pass data to the client component.

**Tech Stack:** Next.js (App Router), React, Drizzle ORM, Tailwind CSS.

---

### Task 1: Server-Side Page Controller Updates

**Files:**
- Modify: [page.tsx](file:///c:/Projetos/Extrairleads/src/app/%28dashboard%29/leads/page.tsx)

**Step 1: Read and validate search parameters**
Add parsing for `campaignId` and `niche` parameters:
```typescript
	const campaignId = params.campaignId ? parseInt(params.campaignId, 10) : undefined;
	const niche = params.niche || "";
```

**Step 2: Fetch metadata (Campaigns and Unique Niches)**
Fetch the campaigns list and extract unique niches from user leads:
```typescript
	const userCampaigns = userId
		? await db
				.select({ id: campaigns.id, name: campaigns.name })
				.from(campaigns)
				.where(eq(campaigns.userId, userId))
				.orderBy(asc(campaigns.name))
		: [];

	const uniqueNiches = Array.from(
		new Set(
			allLeads
				.map((l) => l.niche)
				.filter((n): n is string => n !== null && n !== "")
		)
	).sort();
```

**Step 3: Apply filters to leads list**
```typescript
	const filteredLeads = allLeads.filter((lead) => {
		const matchSearch =
			!search ||
			lead.name?.toLowerCase().includes(search.toLowerCase()) ||
			lead.phone?.includes(search) ||
			lead.website?.toLowerCase().includes(search.toLowerCase());
		const matchStatus = !status || lead.status === status;
		const matchCampaign = !campaignId || lead.campaignId === campaignId;
		const matchNiche = !niche || lead.niche === niche;
		return matchSearch && matchStatus && matchCampaign && matchNiche;
	});
```

**Step 4: Update LeadsClient component rendering**
Pass `campaigns`, `uniqueNiches`, and filter states:
```tsx
				<LeadsClient
					initialSearch={search}
					initialStatus={status}
					initialCampaignId={params.campaignId || ""}
					initialNiche={niche}
					filteredLeads={filteredLeads}
					campaigns={userCampaigns}
					niches={uniqueNiches}
					currentPage={page}
				/>
```

---

### Task 2: Client UI Filters Implementation

**Files:**
- Modify: [client.tsx](file:///c:/Projetos/Extrairleads/src/app/%28dashboard%29/leads/client.tsx)

**Step 1: Update interface and state**
Add `initialCampaignId`, `initialNiche`, `campaigns`, and `niches` to `LeadsClientProps`. Initialize state with them.

**Step 2: Implement query parameters handlers**
Implement state synchronization functions:
```typescript
	const handleStatusChange = (newStatus: string) => {
		setStatus(newStatus);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (newStatus) params.set("status", newStatus);
		if (campaignId && campaignId !== "all") params.set("campaignId", campaignId);
		if (niche && niche !== "all") params.set("niche", niche);
		router.push(`/leads?${params.toString()}`);
	};

	const handleCampaignChange = (newCampaignId: string) => {
		setCampaignId(newCampaignId);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (status) params.set("status", status);
		if (newCampaignId && newCampaignId !== "all") params.set("campaignId", newCampaignId);
		if (niche && niche !== "all") params.set("niche", newNiche);
		router.push(`/leads?${params.toString()}`);
	};

	const handleNicheChange = (newNiche: string) => {
		setNiche(newNiche);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (status) params.set("status", status);
		if (campaignId && campaignId !== "all") params.set("campaignId", campaignId);
		if (newNiche && newNiche !== "all") params.set("niche", newNiche);
		router.push(`/leads?${params.toString()}`);
	};
```

**Step 3: Update `applyFilters` and `handleClear`**
Ensure search submits with all other active filters preserved. Clear button resets all.

**Step 4: Layout dropdowns in UI**
Position Niche and Campaign filters premium select dropdowns alongside search.

---

### Task 3: Verification

**Steps:**
- Verify that filtering leads by Niche only displays leads of that niche.
- Verify that filtering leads by Campaign only displays leads of that campaign.
- Verify that "Limpar Filtros" resets all filters.
