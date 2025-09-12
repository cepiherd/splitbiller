# 📘 Frontend Development Guidelines

This document summarizes best practices and architectural patterns for frontend development using Next.js and modern UI principles.

## 1. 🏗️ Clean Architecture in Next.js

### 🔹 Layers

- **Domain (Entities Layer)**
  - Pure business rules (independent of framework, DB, or API).
  - Example: User, Donation, Order.

- **Application (Use Cases Layer)**
  - Orchestrates entity interaction.
  - Example: CreateDonation, GetUserProfile.

- **Infrastructure (Adapters Layer)**
  - Implements external details.
  - Example: UserRepositoryImpl, PrismaClient, StripeService.

- **Presentation (UI Layer)**
  - Next.js components and pages.
  - Example: UserProfilePage, DonationForm.

### 📂 Suggested Folder Structure

```
src/
  domain/                # Entities
    user.ts
    donation.ts

  application/           # Use Cases
    usecases/
      createDonation.ts
      getUserProfile.ts

  infrastructure/        # Adapters / Implementation
    repositories/
      userRepository.ts
      donationRepository.ts
    services/
      prismaClient.ts
      midtransService.ts

  presentation/          # UI Layer (Next.js)
    components/
      DonationForm.tsx
      UserProfile.tsx
    app/
      user/
        page.tsx
      donation/
        page.tsx
```

### 🔑 Code Examples

#### Entity
```typescript
// domain/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

#### Use Case
```typescript
// application/usecases/getUserProfile.ts
import { User } from "@/domain/user";
import { UserRepository } from "@/infrastructure/repositories/userRepository";

export class GetUserProfile {
  constructor(private userRepo: UserRepository) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepo.findById(userId);
  }
}
```

#### Repository
```typescript
// infrastructure/repositories/userRepository.ts
import { User } from "@/domain/user";
import { prisma } from "../services/prismaClient";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
}

export class UserRepositoryImpl implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? { id: user.id, name: user.name, email: user.email } : null;
  }
}
```

#### UI Page
```typescript
// presentation/app/user/page.tsx
"use client";
import { useEffect, useState } from "react";
import { User } from "@/domain/user";
import { UserRepositoryImpl } from "@/infrastructure/repositories/userRepository";
import { GetUserProfile } from "@/application/usecases/getUserProfile";

export default function UserPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const repo = new UserRepositoryImpl();
    const usecase = new GetUserProfile(repo);

    usecase.execute("123").then(setUser);
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>User Profile</h1>
      <p>{user.name} – {user.email}</p>
    </div>
  );
}
```

### ✅ Benefits of Clean Architecture

- **Separation of Concerns** → UI doesn't care how data is fetched.
- **Testability** → Use cases can be tested without DB/UI.
- **Flexibility** → Swap database (Prisma → Supabase) or services (Midtrans → Stripe) easily.

## 2. 🌐 Frontend Development Principles

### 🔹 Core Principles

- **Separation of Concerns (SoC)**
  - Keep UI, logic, and data access separate.

- **DRY (Don't Repeat Yourself)**
  - Reuse components, hooks, utilities.

- **KISS (Keep It Simple, Stupid)**
  - Prefer clarity and readability over clever complexity.

- **Component Reusability**
  - Break UI into small, composable components.

- **Performance First**
  - Optimize re-renders, lazy load, code split.

- **Accessibility (a11y)**
  - Use semantic HTML, add alt text, test with screen readers.

- **Mobile First / Responsive Design**
  - Design for small screens first, use flexbox/grid.

- **Error Handling & Loading States**
  - Always show loading/error UI states.

- **Version Control Practices**
  - Write meaningful commits, keep branches small.

### Testing

- Unit tests (Jest).
- Integration tests (RTL, Cypress).

### 🔑 Golden Rules

- **Readability > Cleverness**
- **Consistency > Perfection**
- Think about future developers who will maintain your code.

## 3. 🧪 Atomic Design Methodology

Atomic Design is a methodology by Brad Frost for building scalable design systems.

### 🔹 Levels of Atomic Design

1. **Atoms** → smallest UI parts (button, input, label).
2. **Molecules** → atoms combined (search bar, form field).
3. **Organisms** → groups of molecules/atoms (navbar, product card).
4. **Templates** → page-level layout with placeholders.
5. **Pages** → final page filled with real content/data.

### 📂 Example

#### Atom: Button
```typescript
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 rounded bg-blue-600 text-white">{children}</button>;
}
```

#### Molecule: SearchBar
```typescript
import { Button } from "./Button";

export function SearchBar() {
  return (
    <div className="flex">
      <input type="text" placeholder="Search..." className="border p-2 flex-1" />
      <Button>Go</Button>
    </div>
  );
}
```

#### Organism: Navbar
```typescript
import { SearchBar } from "./SearchBar";

export function Navbar() {
  return (
    <nav className="flex justify-between p-4 bg-gray-100">
      <h1>Logo</h1>
      <SearchBar />
    </nav>
  );
}
```

#### Template: BlogTemplate
```typescript
import { Navbar } from "./Navbar";

export function BlogTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto">{children}</main>
      <footer className="p-4 text-center">© 2025 My Blog</footer>
    </div>
  );
}
```

#### Page: Blog Post
```typescript
import { BlogTemplate } from "@/components/BlogTemplate";

export default function BlogPostPage() {
  return (
    <BlogTemplate>
      <article>
        <h2>Atomic Design Explained</h2>
        <p>This is the actual blog content...</p>
      </article>
    </BlogTemplate>
  );
}
```

### ✅ Benefits of Atomic Design

- **Scalability** → large apps from small parts.
- **Consistency** → shared UI language across team.
- **Reusability** → build once, reuse everywhere.
- **Maintainability** → update one atom, system updates everywhere.

## 🎯 Conclusion

By combining:

- **Clean Architecture** (layer separation),
- **Frontend Principles** (SoC, DRY, KISS, reusability), and
- **Atomic Design** (design system methodology),

You can build robust, maintainable, and scalable frontend applications that follow industry best practices.
