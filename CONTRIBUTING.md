# Contributing to CaféFinder

Thank you for your interest in contributing to **CaféFinder**! As an open-source project created under the **ROSP / ROSPL** curriculum, we embrace collaborative, transparent development under the **GNU General Public License v3.0 (GPL-3.0)**.

---

## 🧭 Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Be respectful and constructive in issues, discussions, and pull requests.

---

## 🛠️ Contribution Workflow

1. **Fork or Branch**:
   * For team members, create a descriptive branch:
     * `feature/map-clustering`
     * `fix/popup-overflow`
     * `docs/update-readme`
   * Never commit directly to `main` without testing locally.

2. **Commit Conventions**:
   Use clear, conventional commit messages:
   * `feat: add Leaflet marker clustering for dense areas`
   * `fix: correct longitude and latitude GeoJSON ordering in MapComponent`
   * `docs: add OpenStreetMap attribution notice`
   * `chore: update dependencies`

3. **Verify Builds Locally**:
   Before creating a Pull Request, verify that the frontend and backend build without errors:
   ```bash
   cd client
   npm run build
   npm run lint
   ```

4. **Submit a Pull Request (PR)**:
   * Provide a clear title and description explaining what was changed and why.
   * Reference any relevant Issue numbers.
   * Ensure any newly added code maintains compatibility with GPLv3.

---

## 🗺️ OpenStreetMap Guidelines
* Do not scrape or overwhelm public Nominatim or Overpass instances; always observe rate limits and provide appropriate `User-Agent` headers.
* Always preserve OpenStreetMap copyright attribution (`© OpenStreetMap contributors`).
