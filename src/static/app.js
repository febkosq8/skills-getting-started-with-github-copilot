document.addEventListener("DOMContentLoaded", () => {
	console.log("app.js loaded"); // debug: confirm script ran

	const activitiesList = document.getElementById("activities-list");
	const activitySelect = document.getElementById("activity");
	const signupForm = document.getElementById("signup-form");
	const messageEl = document.getElementById("message");

	function initialsFromEmail(email) {
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
			const res = await fetch("/activities");
			if (!res.ok) throw new Error("Failed to fetch activities");
			const data = await res.json();

			// Clear and populate select
			activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

			activitiesList.innerHTML = "";
			for (const [name, info] of Object.entries(data)) {
				console.debug("Rendering activity:", name, "participants:", (info.participants || []).length); // debug

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

						li.appendChild(avatar);
						li.appendChild(mail);
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
