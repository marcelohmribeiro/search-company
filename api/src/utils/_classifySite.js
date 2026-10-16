const HOST_RULES = [
	{ status: "INSTAGRAM_ONLY", hosts: ["instagram.com", "instagr.am"] },
	{ status: "WHATSAPP_ONLY", hosts: ["wa.me", "whatsapp.com", "wa.link"] },
	{ status: "FACEBOOK_ONLY", hosts: ["facebook.com", "fb.com", "fb.me"] },
	{
		status: "LINK_AGGREGATOR",
		hosts: ["linktr.ee", "linktree.com", "beacons.ai", "bio.link", "bio.site", "lnk.bio", "linkin.bio", "taplink.cc", "campsite.bio", "linkbio.co", "allmylinks.com", "solo.to"],
	},
];

function parseHostname(uri) {
	try {
		const url = new URL(/^https?:\/\//i.test(uri) ? uri : `https://${uri}`);
		return url.hostname.toLowerCase().replace(/^www\./, "");
	} catch {
		return null;
	}
}

/**
 * Classifica o `websiteUri` de um lugar do Google.
 * Subdomínios contam como o domínio principal (`m.facebook.com` é Facebook).
 * @param {string | null | undefined} websiteUri
 * @returns {"NO_WEBSITE" | "INSTAGRAM_ONLY" | "WHATSAPP_ONLY" | "FACEBOOK_ONLY" | "LINK_AGGREGATOR" | "HAS_WEBSITE"}
 * `HAS_WEBSITE` também é usado quando a URL não pode ser lida.
 */
function classifySite(websiteUri) {
	if (!websiteUri?.trim()) return "NO_WEBSITE";

	const hostname = parseHostname(websiteUri.trim());
	if (!hostname) return "HAS_WEBSITE";

	const rule = HOST_RULES.find(({ hosts }) =>
		hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`)),
	);
	return rule?.status ?? "HAS_WEBSITE";
}

export { classifySite };
export default classifySite;
