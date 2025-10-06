# FE-Interview-take-home

This repo contains a simple REST server application with CRUD operations for symptoms and interventions. The code and
documentation for this is in the `server` directory.

You can run the API from the server directory with these commands

```
npm install
npm run build
npm run start
```

Your task is to create a browser-based ui that presents the information about symptoms and interventions to end users.
We would like you to use React and Typescript to build this UI, but beyond that you may whatever frameworks or libraries
you choose.

We encourage you to spend at most 2 hours on this task- we aren't looking for a perfect UI or production-ready code.

## UI Requirements

**_Symptom List_**

- A page that lists all of the symptoms
- Clicking one of items on the list should bring the user to the symptom detail view for that symptom.

**_Symptom Detail_**

- On the symptom detail page, the user can specify the severity they are experiencing: `mild`, `moderate` or `severe`
- Once the user has chosen a severity, the page should display all the interventions associated with that symptom that are
  applicable to the selected severity level.
- Some of the interventions are marked with "S.O.S." indicating that if the user is experiencing a symptom/severity like
  this, they should seek immediate attention. Please call this out visually to the user in those cases.

## Completing this assignment

- Add any code, dependencies and build scripts to the repo.
- Be sure to include simple instructions on how to install/run on a developer workstation.
- Submit your completed assignment in a new github repo or by creating a .zip archive. If you want to submit as a .zip archive,
  Note that gmail and other mail services will block this type of .zip attachment, so you may need to file sharing service like dropbox or google drive.
- If you have any questions about the homework please reach out to tessa@mantacares.com
