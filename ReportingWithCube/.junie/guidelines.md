# Cube.js Project Guidelines & Refactoring Rules

As the AI Agent for this project, you must follow these structural and architectural standards when analyzing or refactoring our Cube.js implementation.

---

## 1. Schema Structure & Modularity
* **Dry Principles:** Avoid repeating SQL logic across multiple cubes. Use `extends` for base cubes that share common dimensions or join logic.
* **Naming Conventions:** * Cubes should be named in PascalCase (e.g., `OrderTransactions`).
    * Measures and Dimensions should be in camelCase.
* **File Organization:** Group cubes by domain (e.g., `/model/cubes/finance/`, `/model/cubes/marketing/`).

## 2. Performance & Optimization
* **Pre-aggregations:** Every cube intended for production reporting must have a `preAggregations` block.
    * Prefer `rollup` type for high-cardinality data.
    * Ensure `refreshKey` is optimized (e.g., checking a `updated_at` timestamp).
* **Join Optimization:** Avoid many-to-many joins where possible. When refactoring, suggest denormalized views in the database if the join logic becomes too complex for Cube.js.

## 3. Security & Multi-tenancy
* **Security Contexts:** All cubes containing sensitive data must implement `query_rewrite` or `check_sql_auth` using the `securityContext`.
* **Multi Tenancy** We use tenant specific reporting databases that use postgres fwd to connect to relevant data for this customer. So that only customer specific data can be accessed. So we do not need tenant specific filtering.

## 4. Maintenance & Quality
* **Description Fields:** Every public-facing measure or dimension must have a `description` property for the BI end-users.
* **Type Safety:** Use JSDoc for type definitions in JavaScript files. Avoid using `any` for transformation logic. Use `.js` extension for all cube definitions as TypeScript may not be supported by the environment.
* **Deprecated Cubes:** If a cube is marked as deprecated, Junie should suggest removing dependencies on it rather than updating it.

---

## Refactoring Instructions for Junie
When I ask for "Refactoring" or "Structural Improvements," prioritize:
1.  **Consolidating duplicated SQL** into reusable base cubes.
2.  **Identifying missing indexes** or refresh keys in pre-aggregations.
3.  **Encapsulating complex JavaScript logic** into helper files in `model/utils/`.