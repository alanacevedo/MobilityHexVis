# MobilityHexVis

MobilityHexVis is a web-based tool for visualizing Origin–Destination flows using H3 indexes. It reads data from a Parquet file and displays movement patterns on a map.

## Requirements

- **Node.js** (v22.13.0 or higher)
- A **flows.parquet** file in the `public/data` directory

## Data Format

Your Parquet file must include the following columns:

| Column     | Description                                   | Required? |
|------------|-----------------------------------------------|-----------|
| **lat_O**  | Origin latitude                               | Yes       |
| **lon_O**  | Origin longitude                              | Yes       |
| **lat_D**  | Destination latitude                          | Yes       |
| **lon_D**  | Destination longitude                         | Yes       |
| **group**  | Integer category representing user type/group | Yes       |
| **count**  | Magnitude of the flow                         | Yes       |
| **start_hour** | Starting hour of the flow                 | Optional  |
| **end_hour**   | Ending hour of the flow                   | Optional  |

## Installation and Usage

1. **Install Dependencies**

    ```bash
    npm install
    ```

2. Place your `flows.parquet` file in the `public/data` directory, then open the local URL shown in the terminal to view and interact with your data.

3. **Start the Development Server**

    ```bash
    npm run dev
    ```


