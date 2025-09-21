(function () {
  const data = window.PROFILE_DATA;
  if (!data) return;

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el && text) el.textContent = text;
  }
  function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el && html) el.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", () => {
    // About window - Updated for new design
    setText("#about .profile-name", `${data.name}`);
    setText("#about .tagline", data.title);
    setText(
      "#about .detail-item:nth-child(1) span",
      `Location: ${data.contact.location}`
    );

    // Education quick line in About
    const edu =
      data.education && data.education[0]
        ? `${data.education[0].qualification}, ${data.education[0].institution}`
        : "";
    if (edu) {
      const eduEl = document.querySelector(
        "#about .detail-item:nth-child(2) span"
      );
      if (eduEl) {
        eduEl.innerHTML = `<strong>Education:</strong> ${edu}`;
      }
    }

    // Experience quick line in About
    const exp =
      data.experience && data.experience[0]
        ? `${data.experience[0].role} at ${data.experience[0].company}`
        : "";
    if (exp) {
      const expEl = document.querySelector(
        "#about .detail-item:nth-child(3) span"
      );
      if (expEl) {
        expEl.innerHTML = `<strong>Experience:</strong> ${exp}`;
      }
    }

    // Contact window
    const emailLink = document.querySelector('#contact a[href^="mailto:"]');
    if (emailLink) emailLink.href = `mailto:${data.contact.email}`;
    if (emailLink) emailLink.textContent = data.contact.email;
    const phoneLink = document.querySelector('#contact a[href^="tel:"]');
    if (phoneLink)
      phoneLink.href = `tel:${data.contact.phone.replace(/\s+/g, "")}`;
    if (phoneLink) phoneLink.textContent = data.contact.phone;
    const ghLink = document.querySelector('#contact a[href*="github.com/"]');
    if (ghLink) ghLink.href = data.contact.github;
    if (ghLink)
      ghLink.textContent = data.contact.github.replace("https://", "");

    // Skills window tags (keep existing style, just ensure key skills present)
    function ensureTag(containerSelector, label) {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const exists = Array.from(container.querySelectorAll(".skill-tag")).some(
        (t) => t.textContent.trim().toLowerCase() === label.toLowerCase()
      );
      if (!exists) {
        const span = document.createElement("span");
        span.className = "skill-tag";
        span.textContent = label;
        container.appendChild(span);
      }
    }
    (data.technical_skills.frontend || []).forEach((s) =>
      ensureTag("#skills .skills-category:nth-of-type(1) .skill-tags", s)
    );
    (data.technical_skills.backend || []).forEach((s) =>
      ensureTag("#skills .skills-category:nth-of-type(2) .skill-tags", s)
    );
    (data.technical_skills.database || []).forEach((s) =>
      ensureTag("#skills .skills-category:nth-of-type(3) .skill-tags", s)
    );
    (data.technical_skills.tools || []).forEach((s) =>
      ensureTag("#skills .skills-category:nth-of-type(4) .skill-tags", s)
    );

    // Projects window: update titles/text to match data order if exists
    const projectCards = document.querySelectorAll("#projects .project-card");
    (data.projects || []).slice(0, projectCards.length).forEach((p, i) => {
      const card = projectCards[i];
      const h3 = card.querySelector("h3");
      if (h3) h3.textContent = p.name;
      const pEl = card.querySelector("p");
      if (pEl) pEl.textContent = p.description;
      const stackEl = card.querySelector(".tech-stack");
      if (stackEl) {
        stackEl.innerHTML = (p.stack || [])
          .map((t) => `<span class="tech-tag">${t}</span>`)
          .join("");
      }
    });

    // Resume window header
    setText("#resume .resume-header h2", data.name);
    setText("#resume .resume-header p", data.title);
    const contactLine = `${data.contact.location} • ${data.contact.email} • ${data.contact.phone}`;
    const contactPara = document.querySelector("#resume .resume-header p + p");
    if (contactPara) contactPara.textContent = contactLine;

    // Resume experience list (first two entries)
    const expSection = document.querySelector(
      "#resume .resume-section:nth-of-type(1)"
    );
    if (expSection && data.experience) {
      const items = expSection.querySelectorAll(".experience-item");
      data.experience.slice(0, items.length).forEach((e, i) => {
        const item = items[i];
        const header = item.querySelector(".experience-header strong");
        const date = item.querySelector(".experience-header .date");
        const company = item.querySelector(".company");
        const ul = item.querySelector("ul");
        if (header) header.textContent = e.role;
        if (date) date.textContent = e.period;
        if (company) company.textContent = `${e.company}`;
        if (ul) {
          ul.innerHTML = (e.achievements || [])
            .map((a) => `<li>${a}</li>`)
            .join("");
        }
      });
    }

    // Education
    const eduSection = document.querySelector(
      "#resume .resume-section:nth-of-type(2)"
    );
    if (eduSection && data.education) {
      const blocks = eduSection.querySelectorAll(".education-item");
      const e0 = data.education[0];
      const e1 = data.education[1];
      if (blocks[0] && e0) {
        blocks[0].innerHTML = `<strong>${e0.qualification}</strong><br/>${e0.institution} • ${e0.date || ""}<br/>`;
      }
      if (blocks[1] && e1) {
        blocks[1].innerHTML = `<strong>${e1.qualification}</strong><br/>${e1.institution}<br/><em>${e1.status || ""}</em>`;
      }
    }
  });
})();
