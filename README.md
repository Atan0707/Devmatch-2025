# 🏗 Pisang2U

Donation platform

## Project Archtecture

<img width="1016" height="493" alt="image" src="https://github.com/user-attachments/assets/bc4ebb39-31df-402d-957b-598d77cd0124" />

We split the module into 2 view, Creator Model and User Model

### Creator Model

- First, user will have to connect to their account via Privy.
- Then, user will have to connect to their content.
- After that, the content will be binded with their content on the smart contract.

### Donator Model

- First, user will have to connect to their wallet via Pisang2U Chrome Extension.
- Then, donators will go to the content that they want to donate on the browser. 
- After that, it will detect if the content have registered or not to Pisang2U smart contract.
- If yes, users would be able to tips the creator stablecoin.
