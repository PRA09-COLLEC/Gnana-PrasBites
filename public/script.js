// ============================================
// GNANA PRASBITES - FOOD MANAGEMENT SCRIPT
// ============================================

const API = "/food";

const $ = (id) => document.getElementById(id);

// ============================================
// DISPLAY SUCCESS AND ERROR MESSAGES
// ============================================

function showMessage(text, type = "success") {
    const box = $("message");

    if (!box) {
        alert(text);
        return;
    }

    box.textContent = text;
    box.className = "message " + type;
}

// ============================================
// COMMON API REQUEST FUNCTION
// Supports JSON and plain-text responses
// ============================================

async function request(url, options = {}) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error(
            "Cannot connect to the server. Check that app7-2.js is running."
        );
    }

    const text = await response.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        let message = `Request failed (${response.status})`;

        if (typeof data === "string" && data.trim()) {
            message = data;
        } else if (data && typeof data === "object") {
            message = data.message || data.error || message;
        }

        throw new Error(message);
    }

    return data;
}

// ============================================
// GET ALL FOOD ITEMS
// ============================================

async function getFoods() {
    const data = await request(API);

    if (!Array.isArray(data)) {
        throw new Error("The server did not return a food list.");
    }

    return data;
}

// ============================================
// HTML ESCAPING
// ============================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ============================================
// FORMAT PRICE
// ============================================

function money(value) {
    const amount = Number(value);

    return Number.isFinite(amount)
        ? "₹" + amount.toFixed(2)
        : "—";
}

// ============================================
// DISPLAY AVAILABILITY
// ============================================

function available(value) {
    const isAvailable =
        Number(value) === 1 ||
        value === true ||
        String(value).toLowerCase() === "available";

    return isAvailable
        ? '<span class="status">Available</span>'
        : '<span class="status unavailable">Unavailable</span>';
}

// ============================================
// RENDER FOOD ID BUTTONS
// ============================================

function renderFoodIds(foods) {
    const container = $("foodIds");

    if (!container) return;

    if (foods.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No food records found.</p>';
        return;
    }

    container.innerHTML = foods.map((food) => `
        <button
            class="id-button"
            type="button"
            data-food-id="${Number(food.food_id)}">
            ID ${Number(food.food_id)}
        </button>
    `).join("");

    container.querySelectorAll("[data-food-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.dataset.foodId;

            if ($("searchId")) {
                $("searchId").value = id;
            }

            if ($("updateId")) {
                $("updateId").value = id;
            }

            if ($("deleteId")) {
                $("deleteId").value = id;
            }

            if ($("food_id")) {
                $("food_id").value = id;
            }

            if ($("searchForm")) {
                loadOneFood(id);
            } else if ($("loadUpdateForm")) {
                loadUpdateFood(id);
            } else if ($("deleteForm")) {
                previewDeleteFood(id);
            } else {
                window.location.href =
                    "listone.html?id=" + encodeURIComponent(id);
            }
        });
    });
}

// ============================================
// RENDER FOOD TABLE
// ============================================

function renderFoodTable(foods) {
    const tbody = $("foodTable");

    if (!tbody) return;

    if (foods.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No matching food items.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = foods.map((food) => `
        <tr>
            <td>${Number(food.food_id)}</td>
            <td>${escapeHTML(food.food_name)}</td>
            <td>${escapeHTML(food.category)}</td>
            <td>${money(food.price)}</td>
            <td>${escapeHTML(food.description)}</td>
            <td>${available(food.availability)}</td>
            <td>
                <button
                    class="btn btn-secondary"
                    type="button"
                    data-view-id="${Number(food.food_id)}">
                    View
                </button>

                <button
                    class="btn btn-secondary"
                    type="button"
                    data-update-id="${Number(food.food_id)}">
                    Update
                </button>

                <button
                    class="btn btn-secondary"
                    type="button"
                    data-delete-id="${Number(food.food_id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-view-id]").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href =
                "listone.html?id=" +
                encodeURIComponent(button.dataset.viewId);
        });
    });

    tbody.querySelectorAll("[data-update-id]").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href =
                "update.html?id=" +
                encodeURIComponent(button.dataset.updateId);
        });
    });

    tbody.querySelectorAll("[data-delete-id]").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href =
                "delete.html?id=" +
                encodeURIComponent(button.dataset.deleteId);
        });
    });
}

// ============================================
// FOOD DETAIL HTML
// ============================================

function foodDetailHTML(food) {
    return `
        <div class="food-detail">
            <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80"
                alt="Food presentation">

            <div>
                <span class="eyebrow">
                    FOOD ID: ${Number(food.food_id)}
                </span>

                <h2>${escapeHTML(food.food_name)}</h2>

                <p>
                    <strong>Category:</strong>
                    ${escapeHTML(food.category)}
                </p>

                <p>
                    <strong>Price:</strong>
                    ${money(food.price)}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${escapeHTML(food.description)}
                </p>

                <p style="margin-top:12px">
                    ${available(food.availability)}
                </p>
            </div>
        </div>
    `;
}

// ============================================
// LIST ONE FOOD ITEM
// ============================================

async function loadOneFood(id) {
    try {
        if (!id) {
            throw new Error("Please enter a food ID.");
        }

        const food = await request(
            `${API}/${encodeURIComponent(id)}`
        );

        if ($("foodDetails")) {
            $("foodDetails").innerHTML = foodDetailHTML(food);
        }

        showMessage("Food item loaded successfully.");
    } catch (error) {
        if ($("foodDetails")) {
            $("foodDetails").innerHTML =
                '<p class="empty-state">Food item could not be found.</p>';
        }

        showMessage(error.message, "error");
    }
}

// ============================================
// LOAD FOOD FOR UPDATE
// ============================================

async function loadUpdateFood(id) {
    try {
        if (!id) {
            throw new Error("Please enter a food ID.");
        }

        const food = await request(
            `${API}/${encodeURIComponent(id)}`
        );

        $("food_id").value = food.food_id;
        $("food_name").value = food.food_name ?? "";
        $("category").value = food.category ?? "";
        $("price").value = food.price ?? "";
        $("description").value = food.description ?? "";
        $("availability").value =
            Number(food.availability) === 1 ? "1" : "0";

        showMessage("Food details loaded. You can now edit them.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

// ============================================
// PREVIEW FOOD BEFORE DELETING
// ============================================

async function previewDeleteFood(id) {
    try {
        if (!id) {
            throw new Error("Please enter a food ID.");
        }

        const food = await request(
            `${API}/${encodeURIComponent(id)}`
        );

        if ($("foodDetails")) {
            $("foodDetails").innerHTML = foodDetailHTML(food);
        }

        showMessage("Review the food details before deleting.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

// ============================================
// INITIALISE ALL PAGE FEATURES
// ============================================

async function initialise() {
    try {
        // Load food records for pages that need the ID buttons or table.
        const foods = await getFoods();

        renderFoodIds(foods);
        renderFoodTable(foods);

        // SEARCH FILTER
        const filter = $("foodFilter");

        if (filter) {
            filter.addEventListener("input", () => {
                const query = filter.value.toLowerCase();

                renderFoodTable(foods.filter((food) =>
                    String(food.food_name ?? "")
                        .toLowerCase().includes(query) ||
                    String(food.category ?? "")
                        .toLowerCase().includes(query)
                ));
            });
        }

        // ====================================
        // INSERT FOOD
        // ====================================

        if ($("insertForm")) {
            $("insertForm").addEventListener("submit", async (event) => {
                event.preventDefault();

                const form = event.currentTarget;
                const data = Object.fromEntries(new FormData(form));

                data.price = Number(data.price);
                data.availability = Number(data.availability);

                try {
                    const result = await request(API, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(data)
                    });

                    form.reset();

                    showMessage(
                        (result?.message || "Food inserted successfully!") +
                        (result?.food_id
                            ? " Food ID: " + result.food_id
                            : "")
                    );
                } catch (error) {
                    showMessage(
                        "Insertion failed: " + error.message,
                        "error"
                    );
                }
            });
        }

        // ====================================
        // SEARCH ONE FOOD ITEM
        // ====================================

        if ($("searchForm")) {
            $("searchForm").addEventListener("submit", (event) => {
                event.preventDefault();
                loadOneFood($("searchId").value.trim());
            });

            const id = new URLSearchParams(
                window.location.search
            ).get("id");

            if (id) {
                $("searchId").value = id;
                loadOneFood(id);
            }
        }

        // ====================================
        // LOAD UPDATE FORM
        // ====================================

        if ($("loadUpdateForm")) {
            $("loadUpdateForm").addEventListener("submit", (event) => {
                event.preventDefault();
                loadUpdateFood($("updateId").value.trim());
            });
        }

        const updateId = new URLSearchParams(
            window.location.search
        ).get("id");

        if (updateId && $("updateForm")) {
            loadUpdateFood(updateId);
        }

        // ====================================
        // UPDATE FOOD ITEM
        // ====================================

        if ($("updateForm")) {
            $("updateForm").addEventListener("submit", async (event) => {
                event.preventDefault();

                const id = $("food_id").value.trim();

                if (!id) {
                    showMessage(
                        "Load a food item before updating.",
                        "error"
                    );
                    return;
                }

                const data = {
                    food_name: $("food_name").value.trim(),
                    category: $("category").value.trim(),
                    price: Number($("price").value),
                    description: $("description").value.trim(),
                    availability: Number($("availability").value)
                };

                try {
                    const result = await request(
                        `${API}/${encodeURIComponent(id)}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(data)
                        }
                    );

                    showMessage(
                        result?.message ||
                        "Food item updated successfully!"
                    );
                } catch (error) {
                    showMessage(
                        "Update failed: " + error.message,
                        "error"
                    );
                }
            });
        }

        // ====================================
        // PREVIEW DELETE FOOD ITEM
        // ====================================

        if ($("previewDelete")) {
            $("previewDelete").addEventListener("click", () => {
                previewDeleteFood($("deleteId").value.trim());
            });
        }

        // ====================================
        // DELETE FOOD ITEM
        // ====================================

        if ($("deleteForm")) {
            $("deleteForm").addEventListener("submit", async (event) => {
                event.preventDefault();

                const id = $("deleteId").value.trim();

                if (!id) {
                    showMessage("Please enter a food ID.", "error");
                    return;
                }

                if (!confirm(
                    "Are you sure you want to delete food ID " + id + "?"
                )) {
                    return;
                }

                try {
                    const result = await request(
                        `${API}/${encodeURIComponent(id)}`,
                        {
                            method: "DELETE"
                        }
                    );

                    showMessage(
                        result?.message ||
                        "Food item deleted successfully!"
                    );

                    $("deleteForm").reset();

                    if ($("foodDetails")) {
                        $("foodDetails").innerHTML = "";
                    }

                    // Refresh ID buttons after deletion.
                    const refreshedFoods = await getFoods();
                    renderFoodIds(refreshedFoods);
                    renderFoodTable(refreshedFoods);

                } catch (error) {
                    showMessage(
                        "Delete failed: " + error.message,
                        "error"
                    );
                }
            });
        }

    } catch (error) {
        showMessage(
            "Could not load food records. Check that app7-2.js is running " +
            "and MySQL is connected. " + error.message,
            "error"
        );
    }
}

// ============================================
// START SCRIPT AFTER PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", initialise);