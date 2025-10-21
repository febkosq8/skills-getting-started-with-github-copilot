document.addEventListener("DOMContentLoaded", () => {

	const activitiesList = document.getElementById("activities-list");
	const activitySelect = document.getElementById("activity");
	const signupForm = document.getElementById("signup-form");
	const messageEl = document.getElementById("message");

	function initialsFromEmail(email) {
		// Basic email format validation: must match common email pattern (local@domain.tld)
		if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
			return email.slice(0, 1).toUpperCase();
		}
		const local = email.split("@")[0] || "";
		const parts = local.split(/[\.\-_]/).filter(Boolean);
		if (parts.length === 0) return email.slice(0, 1).toUpperCase();
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}

	function showMessage(text, type = "info") {
		messageEl.textContent = text;
		messageEl.className = `message ${type}`;
		messageEl.classList.remove("hidden");
		clearTimeout(messageEl._hideTimeout);
		messageEl._hideTimeout = setTimeout(() => {
			messageEl.classList.add("hidden");
		}, 5000);
	}

	async function loadActivities() {
		activitiesList.innerHTML = "<p>Loading activities...</p>";
		try {
			const res = await fetch("/activities", { cache: "no-store" });
			if (!res.ok) throw new Error("Failed to fetch activities");
			const data = await res.json();

			// Clear and populate select
			activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

			activitiesList.innerHTML = "";
			for (const [name, info] of Object.entries(data)) {
				// add option to select so users can choose an activity without page refresh
				const opt = document.createElement("option");
				opt.value = name;
				opt.textContent = name;
				activitySelect.appendChild(opt);
				if (window.DEBUG) {
					console.debug("Rendering activity:", name, "participants:", (info.participants || []).length); // debug
				}

				// card
				const card = document.createElement("div");
				card.className = "activity-card";

				const title = document.createElement("h4");
				title.textContent = name;
				card.appendChild(title);

				const desc = document.createElement("p");
				desc.textContent = info.description || "";
				card.appendChild(desc);

				const sched = document.createElement("p");
				sched.innerHTML = `<strong>Schedule:</strong> ${info.schedule || "TBD"}`;
				card.appendChild(sched);

				// Participants section
				const participantsSection = document.createElement("div");
				participantsSection.className = "participants";

				const count = (info.participants && info.participants.length) || 0;
				const heading = document.createElement("h5");
				heading.textContent = `Participants (${count})`;
				participantsSection.appendChild(heading);

				const ul = document.createElement("ul");
				ul.className = "participants-list";

				if (count === 0) {
					const li = document.createElement("li");
					li.className = "participant-item";
					li.textContent = "No participants yet";
					ul.appendChild(li);
				} else {
					for (const p of info.participants) {
						const li = document.createElement("li");
						li.className = "participant-item";

						const avatar = document.createElement("span");
						avatar.className = "avatar";
						avatar.textContent = initialsFromEmail(p);

						const mail = document.createElement("a");
						mail.className = "participant-email";
						mail.href = `mailto:${p}`;
						mail.textContent = p;

						// Actions container (for delete button)
						const actions = document.createElement("div");
						actions.className = "participant-actions";

						// Delete button
						const delBtn = document.createElement("button");
						delBtn.type = "button";
						delBtn.className = "btn-icon";
						delBtn.title = `Unregister ${p}`;
						// Create SVG icon safely using DOM methods
						const svgNS = "http://www.w3.org/2000/svg";
						const svg = document.createElementNS(svgNS, "svg");
						svg.setAttribute("viewBox", "0 0 24 24");
						svg.setAttribute("fill", "none");
						svg.setAttribute("xmlns", svgNS);
						// Path 1
						const path1 = document.createElementNS(svgNS, "path");
						path1.setAttribute("d", "M3 6h18");
						path1.setAttribute("stroke", "currentColor");
						path1.setAttribute("stroke-width", "2");
						path1.setAttribute("stroke-linecap", "round");
						path1.setAttribute("stroke-linejoin", "round");
						svg.appendChild(path1);
						// Path 2
						const path2 = document.createElementNS(svgNS, "path");
						path2.setAttribute("d", "M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6");
						path2.setAttribute("stroke", "currentColor");
						path2.setAttribute("stroke-width", "2");
						path2.setAttribute("stroke-linecap", "round");
						path2.setAttribute("stroke-linejoin", "round");
						svg.appendChild(path2);
						// Path 3
						const path3 = document.createElementNS(svgNS, "path");
						path3.setAttribute("d", "M10 11v6");
						path3.setAttribute("stroke", "currentColor");
						path3.setAttribute("stroke-width", "2");
						path3.setAttribute("stroke-linecap", "round");
						path3.setAttribute("stroke-linejoin", "round");
						svg.appendChild(path3);
						// Path 4
						const path4 = document.createElementNS(svgNS, "path");
						path4.setAttribute("d", "M14 11v6");
						path4.setAttribute("stroke", "currentColor");
						path4.setAttribute("stroke-width", "2");
						path4.setAttribute("stroke-linecap", "round");
						path4.setAttribute("stroke-linejoin", "round");
						svg.appendChild(path4);
						// Path 5
						const path5 = document.createElementNS(svgNS, "path");
						path5.setAttribute("d", "M9 6V4h6v2");
						path5.setAttribute("stroke", "currentColor");
						path5.setAttribute("stroke-width", "2");
						path5.setAttribute("stroke-linecap", "round");
						path5.setAttribute("stroke-linejoin", "round");
						svg.appendChild(path5);
						delBtn.appendChild(svg);

						// Attach click handler to unregister
						delBtn.addEventListener("click", async () => {
							if (!confirm(`Unregister ${p} from ${name}?`)) return;
							try {
								const url = `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`;
								const res = await fetch(url, { method: "DELETE" });
								const body = await res.json();
								if (!res.ok) {
									showMessage(body.detail || "Failed to unregister.", "error");
								} else {
									showMessage(body.message || "Participant unregistered", "success");
									// refresh participants list for the activity (simple approach: reload all)
									await loadActivities();
								}
							} catch (err) {
								console.error(err);
								showMessage("Network error while unregistering.", "error");
							}
						});

						li.appendChild(avatar);
						li.appendChild(mail);
						actions.appendChild(delBtn);
						li.appendChild(actions);
						ul.appendChild(li);
					}
				}

				participantsSection.appendChild(ul);
				card.appendChild(participantsSection);

				activitiesList.appendChild(card);
			}
		} catch (err) {
			activitiesList.innerHTML = `<p class="error">Could not load activities.</p>`;
			console.error(err);
		}
	}

	signupForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const email = document.getElementById("email").value.trim();
		const activity = document.getElementById("activity").value;
		if (!activity) {
			showMessage("Please select an activity to sign up.", "error");
			return;
		}
		if (!email) {
			showMessage("Please enter a valid email.", "error");
			return;
		}

		try {
			const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
			const res = await fetch(url, { method: "POST" });
			const body = await res.json();
			if (!res.ok) {
				showMessage(body.detail || "Failed to sign up.", "error");
			} else {
				showMessage(body.message || "Signed up successfully!", "success");
				signupForm.reset();
				await loadActivities(); // refresh list to show new participant
			}
		} catch (err) {
			console.error(err);
			showMessage("Network error while signing up.", "error");
		}
	});

	// initial load
	loadActivities();
});
