### Module 1: Authentication & Profiles (`/api/v1/auth`)

- **`POST /auth/organization-signup`**
   - **Type**: Public Registration
   - **Reason**: Creates a pending transport company account and profile from
     the signup page.
- **`POST /auth/organization-login`**
   - **Type**: Company Authentication
   - **Reason**: Logs a transport company administrator into their dashboard.
- **`POST /auth/admin-login`**
   - **Type**: Platform Operator Authentication
   - **Reason**: Logs a platform administrator into the global admin panel.
- **`POST /auth/driver-login`**
   - **Type**: Driver Authentication
   - **Reason**: Logs a driver into the mobile-optimized driver portal.
- **`GET /auth/me`**
   - **Type**: Session Recovery
   - **Reason**: Restores active login session details on page refresh.

---

### Module 2: Driver Management (`/api/v1/driver`)

- **`POST /driver`**
   - **Type**: Driver Account Creation
   - **Reason**: Creates a driver account under the logged-in company.
- **`GET /driver`**
   - **Type**: Directory Query
   - **Reason**: populates the driver roster view in the company dashboard.
- **`PATCH /driver/:id/active`**
   - **Type**: Status Toggle
   - **Reason**: Enables or disables a driver's active profile status.
- **`PATCH /driver/:id/password`**
   - **Type**: Security Reset
   - **Reason**: Updates or overrides a driver's login password.
- **`DELETE /driver/:id`**
   - **Type**: Account Deletion
   - **Reason**: Removes a driver permanently from the company.

---

### Module 3: Booking Engine (`/api/v1/booking`)

- **`POST /booking`**
   - **Type**: Reservation Creation
   - **Reason**: Submits a newly created GKV (statutory) or Private patient
     booking.
- **`GET /booking`**
   - **Type**: Directory Query
   - **Reason**: Fetches the bookings table for the company dashboard.
- **`PATCH /booking/:id/assign`**
   - **Type**: Task Assignment
   - **Reason**: Dispatches a selected driver to a specific trip.
- **`PATCH /booking/:id/status`**
   - **Type**: Status Transition
   - **Reason**: Completes, cancels, or reactivates an existing booking.
- **`GET /booking/estimate`**
   - **Type**: Geospatial Utility
   - **Reason**: Calculates trip duration and distance estimates dynamically
     during checkout.

---

### Module 4: Tariffs & Surcharges (`/api/v1/pricing` & `/api/v1/surcharge`)

- **`GET /pricing`**
   - **Type**: Directory Query
   - **Reason**: Loads active pricing rates and extra options for booking forms.
- **`PUT /pricing`**
   - **Type**: Rate Adjustment
   - **Reason**: Updates the default base and per-kilometer travel charges.
- **`POST /surcharge`**
   - **Type**: Custom Surcharge Creation
   - **Reason**: Adds a custom option surcharge (such as carrying chair,
     staircase help).
- **`PUT /surcharge/:id`**
   - **Type**: Custom Surcharge Adjustment
   - **Reason**: Modifies labels or prices on an existing surcharge.
- **`DELETE /surcharge/:id`**
   - **Type**: Custom Surcharge Removal
   - **Reason**: Deletes a custom extra option surcharge.

---

### Module 5: Bank Details (`/api/v1/bank`)

- **`GET /bank`**
   - **Type**: Directory Query
   - **Reason**: Shows company payment coordinates on receipts or dashboard
     settings.
- **`PUT /bank`**
   - **Type**: Billing Configuration
   - **Reason**: Updates the company's bank connection details.

---

### Module 6: Platform Invoicing (`/api/v1/invoice`)

- **`GET /invoice`**
   - **Type**: Directory Query
   - **Reason**: Populates invoices, billing months, and platform commission
     lists.
- **`POST /invoice`**
   - **Type**: Commission Ledger Creation
   - **Reason**: Creates a platform operator bill for a specific company's
     monthly trips.
- **`PATCH /invoice/:id/status`**
   - **Type**: Payment Status Update
   - **Reason**: Changes invoice status to Paid, Unpaid, or Overdue.
- **`DELETE /invoice/:id`**
   - **Type**: Commission Ledger Deletion
   - **Reason**: Deletes an invoice record.

---

### Module 7: Platform Administration Directory (`/api/v1/admin`)

- **`GET /admin/companies`**
   - **Type**: Directory Query
   - **Reason**: Displays all registered transport services in the global
     console.
- **`PATCH /admin/companies/:id/status`**
   - **Type**: Status Approval
   - **Reason**: Approves, rejects, or blocks a company's active platform
     status.
- **`DELETE /admin/companies/:id`**
   - **Type**: Directory Deletion
   - **Reason**: Deletes a company account permanently.

---

### Module 8: Live Geo location Tracking (`/api/v1/tracking-state`)

- **`GET /tracking-state/:bookingId`**
   - **Type**: Directory Query
   - **Reason**: Retrieves live coordinate pathing points to show on maps.
- **`POST /tracking-state/:bookingId/start`**
   - **Type**: Task Activation
   - **Reason**: Begins a mock trip simulation loop.
- **`PATCH /tracking-state/:bookingId/progress`**
   - **Type**: Live Coordinate Step
   - **Reason**: Increments path progress tracking steps.
- **`POST /tracking-state/:bookingId/pause`**
   - **Type**: Task Pause
   - **Reason**: Pauses tracking update triggers temporarily.
- **`DELETE /tracking-state/:bookingId`**
   - **Type**: Task Deactivation
   - **Reason**: Ends map tracking updates and resets position values.

---

### Module 9: Drivers Portal Tasks (`/api/v1/driver-portal`)

- **`GET /driver-portal/available-rides`**
   - **Type**: Directory Query
   - **Reason**: Lists open bookings waiting to be claimed by local drivers.
- **`PATCH /driver-portal/rides/:id/accept`**
   - **Type**: Self Assignment
   - **Reason**: Allows a driver to claim a trip booking.
- **`PATCH /driver-portal/rides/:id/release`**
   - **Type**: Self Relinquish
   - **Reason**: Allows a driver to return an assigned trip back to the public
     pool.
- **`GET /driver-portal/my-rides`**
   - **Type**: Directory Query   
   - **Reason**: Loads current and historically completed jobs assigned to the
     logged-in driver.
