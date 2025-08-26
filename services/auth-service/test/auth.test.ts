import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { superoak } from "https://deno.land/x/superoak@v4.7.0/mod.ts";

import { authRouter } from "../routes/auth.ts";
import { healthRouter } from "../routes/health.ts";

const app = new Application();
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(healthRouter.routes());
app.use(healthRouter.allowedMethods());

Deno.test("Health Check", async () => {
  const request = await superoak(app);
  const response = await request.get("/health").expect(200);
  
  assertEquals(response.body.status, "healthy");
  assertEquals(response.body.service, "auth-service");
});

Deno.test("Register User", async () => {
  const request = await superoak(app);
  const userData = {
    phone: "+905551234567",
    email: "test@example.com",
    password: "testpassword123",
    firstName: "Test",
    lastName: "User"
  };
  
  const response = await request
    .post("/register")
    .send(userData)
    .expect(201);
  
  assertExists(response.body.user);
  assertExists(response.body.token);
  assertEquals(response.body.user.phone, userData.phone);
  assertEquals(response.body.user.email, userData.email);
});

Deno.test("Login User", async () => {
  const request = await superoak(app);
  const loginData = {
    phone: "+905551234567",
    password: "testpassword123"
  };
  
  const response = await request
    .post("/login")
    .send(loginData)
    .expect(200);
  
  assertExists(response.body.user);
  assertExists(response.body.token);
  assertEquals(response.body.user.phone, loginData.phone);
});

Deno.test("Request OTP", async () => {
  const request = await superoak(app);
  const otpData = {
    phone: "+905551234567"
  };
  
  const response = await request
    .post("/otp/request")
    .send(otpData)
    .expect(200);
  
  assertEquals(response.body.message, "OTP sent successfully");
});

Deno.test("Verify OTP", async () => {
  const request = await superoak(app);
  const otpData = {
    phone: "+905551234567",
    otp: "123456" // Mock OTP
  };
  
  const response = await request
    .post("/otp/verify")
    .send(otpData)
    .expect(200);
  
  assertExists(response.body.user);
  assertExists(response.body.token);
});

Deno.test("Invalid Login", async () => {
  const request = await superoak(app);
  const loginData = {
    phone: "+905551234567",
    password: "wrongpassword"
  };
  
  await request
    .post("/login")
    .send(loginData)
    .expect(401);
});

Deno.test("Invalid Registration", async () => {
  const request = await superoak(app);
  const userData = {
    phone: "invalid-phone",
    password: "short"
  };
  
  await request
    .post("/register")
    .send(userData)
    .expect(400);
});
