
const API_URL = "https://script.google.com/macros/s/AKfycbx0T6-iQDXq0juMsJ22GzSTBqi85ng-O1db0jNVWbFpgzV5YG2U2NQFsIvZCzOtjBFV/exec";

export default {
    data() {
        return {
            player: "",
            level: "",
            progress: 100,
            video: "",
            submitting: false,
            message: "",
            success: false
        };
    },

    template: `
        <main style="max-width: 600px; margin: 2rem auto; padding: 1.5rem;">
            <h1>Submit a Record</h1>
            <p>Submit your Geometry Dash progress for review.</p>

            <form @submit.prevent="submitRecord">
                <label for="player">Player username</label>
                <input
                    id="player"
                    v-model.trim="player"
                    maxlength="50"
                    required
                    style="display:block; width:100%; margin:0.5rem 0 1rem;"
                />

                <label for="level">Level name</label>
                <input
                    id="level"
                    v-model.trim="level"
                    maxlength="100"
                    required
                    style="display:block; width:100%; margin:0.5rem 0 1rem;"
                />

                <label for="progress">Progress (%)</label>
                <input
                    id="progress"
                    v-model.number="progress"
                    type="number"
                    min="1"
                    max="100"
                    required
                    style="display:block; width:100%; margin:0.5rem 0 1rem;"
                />

                <label for="video">Video proof URL</label>
                <input
                    id="video"
                    v-model.trim="video"
                    type="url"
                    placeholder="https://..."
                    maxlength="2000"
                    style="display:block; width:100%; margin:0.5rem 0 1rem;"
                />

                <button type="submit" :disabled="submitting">
                    {{ submitting ? "Submitting..." : "Submit Record" }}
                </button>

                <p v-if="message" role="status" aria-live="polite">
                    {{ message }}
                </p>
            </form>
        </main>
    `,

    methods: {
        async submitRecord() {
            if (this.submitting) return;

            if (
                !Number.isInteger(this.progress) ||
                this.progress < 1 ||
                this.progress > 100
            ) {
                this.message = "Progress must be between 1 and 100.";
                return;
            }

            if (
                this.video &&
                (!this.video.startsWith("https://") ||
                    !URL.canParse(this.video))
            ) {
                this.message = "Please enter a valid HTTPS video URL.";
                return;
            }

            this.submitting = true;
            this.message = "";
            this.success = false;

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({
                        action: "submit",
                        player: this.player,
                        level: this.level,
                        progress: this.progress,
                        video: this.video
                    })
                });

                const result = await response.json();

                if (!result.ok) {
                    throw new Error(result.error || "Submission failed.");
                }

                this.success = true;
                this.message =
                    "Record submitted! It is now pending review.";

                this.player = "";
                this.level = "";
                this.progress = 100;
                this.video = "";
            } catch (error) {
                console.error("Record submission error:", error);
                this.message =
                    "Could not confirm submission. Please try again later.";
            } finally {
                this.submitting = false;
            }
        }
    }
};