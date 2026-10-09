
const API_URL = "https://script.google.com/macros/s/AKfycbx0T6-iQDXq0juMsJ22GzSTBqi85ng-O1db0jNVWbFpgzV5YG2U2NQFsIvZCzOtjBFV/exec";

export default {
    data() {
        return {
            password: "",
            authenticated: false,
            records: [],
            loading: false,
            reviewingId: null,
            message: "",
            error: ""
        };
    },

    template: `
        <main style="max-width: 1200px; margin: 2rem auto; padding: 1.5rem;">
            <h1>Admin — Record Submissions</h1>

            <section v-if="!authenticated">
                <p>Log in to review pending records.</p>

                <form @submit.prevent="login">
                    <label for="admin-password">Admin password</label>

                    <input
                        id="admin-password"
                        v-model="password"
                        type="password"
                        autocomplete="current-password"
                        required
                        style="display:block; width:100%; max-width:1000px; box-sizing:border-box; margin:1rem 0 1rem; padding:1.2rem;"
                    />

                    <button type="submit" :disabled="loading" style="color: #000;">
                        {{ loading ? "Logging in..." : "Log in" }}
                    </button>
                </form>
            </section>

            <section v-else>
                <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center; margin:1rem 0;">
                    <button @click="loadRecords" :disabled="loading" style="color: #000;">
                        {{ loading ? "Loading..." : "Refresh records" }}
                    </button>

                    <button @click="logout" style="color: #000;">
                        Log out
                    </button>
                </div>

                <p v-if="records.length === 0 && !loading">
                    No pending submissions.
                </p>

                <article
                    style="
                    width: 100%;
                    height: 100%;
                    max-width: 900px;
                    max-height: 600px;
                    margin: 5rem 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-sizing: border-box;
                    padding: 40px;
                    "
                    v-for="record in records"
                    :key="record.id"
                >
                    <h2 style="margin-top:0;">{{ record.level }}</h2>

                    <p><strong>Player:</strong> {{ record.player }}</p>
                    <p><strong>Progress:</strong> {{ record.progress }}%</p>
                    <p>
                        <strong>Submitted:</strong>
                        {{ formatDate(record.submittedAt) }}
                    </p>

                    
                    <p>
                        <strong>Status:</strong>
                        {{ record.status }}
                    </p>

                    <p v-if="record.video">
                        <strong>Video proof:</strong>
                        <a
                            :href="record.video"
                            target="_blank"
                            rel="noopener noreferrer"
                        >Open video</a>
                    </p>

                    <p v-else>No video link provided.</p>

                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                        <button
                            @click="review(record, 'Approved')"
                            :disabled="reviewingId !== null || loading"
                            style="color: #000;"
                        >
                            {{ reviewingId === record.id ? "Processing..." : "Approve" }}
                        </button>

                        <button
                            @click="review(record, 'Rejected')"
                            :disabled="reviewingId !== null || loading"
                            style="color: #000;"
                        >
                            Reject
                        </button>
                    </div>
                </article>
            </section>

            <p v-if="message" role="status" aria-live="polite">
                {{ message }}
            </p>

            <p v-if="error" role="alert" style="color:#d33;">
                {{ error }}
            </p>
        </main>
    `,

    methods: {
        async apiRequest(payload) {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || "The request failed.");
            }

            return result;
        },

        async login() {
            if (this.loading) return;

            this.loading = true;
            this.error = "";
            this.message = "";

            try {
                await this.apiRequest({
                    action: "adminList",
                    password: this.password
                });

                this.authenticated = true;
                await this.loadRecords();
            } catch (err) {
                this.error =
                    err.message === "Unauthorized."
                        ? "Incorrect admin password."
                        : "Login failed: " + err.message;
            } finally {
                this.loading = false;
            }
        },

        async loadRecords() {
            if (this.loading) return;

            this.loading = true;
            this.error = "";
            this.message = "";

            try {
                const result = await this.apiRequest({
                    action: "adminList",
                    password: this.password
                });

                this.records = result.records || [];
            } catch (err) {
                this.error = "Could not load records: " + err.message;
            } finally {
                this.loading = false;
            }
        },

        async review(record, status) {
            if (this.reviewingId !== null || this.loading) return;

            const action = status === "Approved" ? "approve" : "reject";

            if (!window.confirm(
                "Are you sure you want to " + action +
                " the record for " + record.player +
                " — " + record.level + "?"
            )) {
                return;
            }

            this.reviewingId = record.id;
            this.error = "";
            this.message = "";

            try {
                await this.apiRequest({
                    action: "adminUpdateStatus",
                    password: this.password,
                    id: record.id,
                    status: status
                });

                this.records = this.records.filter(
                    item => item.id !== record.id
                );

                this.message = "Record " + status.toLowerCase() + ".";
            } catch (err) {
                this.error = "Could not update record: " + err.message;
            } finally {
                this.reviewingId = null;
            }
        },

        formatDate(value) {
            const date = new Date(value);

            return Number.isNaN(date.getTime())
                ? String(value)
                : date.toLocaleString();
        },

        logout() {
            this.password = "";
            this.authenticated = false;
            this.records = [];
            this.message = "";
            this.error = "";
        }
    }
};