export type DeepSourceIssue = {
	deepsourceIssueId: string;
	title: string;
	severity: string;
	file_path: string;
	category: string;
};

async function deepSourceGraphQL<T>(
	query: string,
	variables: Record<string, unknown>
): Promise<T> {
	const token = process.env.DEEPSOURCE_TOKEN;
	if (!token) {
		throw new Error('DEEPSOURCE_TOKEN is not set');
	}

	const res = await fetch('https://api.deepsource.com/graphql/', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'content-type': 'application/json',
			accept: 'application/json',
		},
		body: JSON.stringify({ query, variables }),
		cache: 'no-store',
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`DeepSource GraphQL error ${res.status}: ${text}`);
	}

	const json = (await res.json()) as {
		data?: T;
		errors?: Array<{ message?: string }>;
	};
	if (json.errors?.length) {
		throw new Error(
			`DeepSource GraphQL errors: ${json.errors.map((e) => e.message ?? '').join('; ')}`
		);
	}
	if (!json.data) {
		throw new Error('DeepSource GraphQL returned empty data');
	}

	return json.data;
}

export async function fetchDeepSourceIssuesByRepo(
	owner: string,
	repo: string
): Promise<DeepSourceIssue[]> {
	const query = `
    query RepoIssues($login: String!, $name: String!, $vcsProvider: VCSProvider!, $checksFirst: Int!, $occFirst: Int!) {
      repository(name: $name, login: $login, vcsProvider: $vcsProvider) {
        checks(first: $checksFirst) {
          edges {
            node {
              occurrences(first: $occFirst) {
                edges {
                  node {
                    path
                    title
                    issue {
                      id
                      severity
                      category
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

	type Response = {
		repository?: {
			checks?: {
				edges?: Array<{
					node?: {
						occurrences?: {
							edges?: Array<{
								node?: {
									path?: string;
									title?: string;
									issue?: { id?: string; severity?: string; category?: string };
								};
							}>;
						};
					};
				}>;
			};
		};
	};

	// Note: enums are case-sensitive; DeepSource uses VCSProvider values like GITHUB.
	const data = await deepSourceGraphQL<Response>(query, {
		login: owner,
		name: repo,
		vcsProvider: 'GITHUB',
		checksFirst: 5,
		occFirst: 50,
	});

	const edges = data.repository?.checks?.edges ?? [];
	const issues: DeepSourceIssue[] = [];

	for (const checkEdge of edges) {
		const occEdges = checkEdge.node?.occurrences?.edges ?? [];
		for (const occEdge of occEdges) {
			const node = occEdge.node;
			if (!node?.issue?.id || !node.path || !node.title) continue;
			issues.push({
				deepsourceIssueId: node.issue.id,
				title: node.title,
				severity: node.issue.severity ?? 'Minor',
				file_path: node.path,
				category: node.issue.category ?? 'bug-risk',
			});
		}
	}

	return issues;
}
