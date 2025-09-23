import { getKeyValue } from '../../utils/helpers';

const termsMapData_ = await import(
  `../../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

const getViewDataFromCells = (cells) => {
  // Title
  const titleMetadata = getKeyValue(cells, 'Title');
  // Author
  const authorMetadata = getKeyValue(cells, 'Author');
  // Short Description
  const shortDescMetadata = getKeyValue(
    cells,
    termsMapData['Short Description'],
  );
  // Site name
  const siteNameUrl = getKeyValue(cells, 'SiteName');
  // Path
  const path = getKeyValue(cells, 'Path');
  // Document Type
  const documentType = getKeyValue(cells, termsMapData['Document Type']);
  // UniqueId
  const UniqueId = getKeyValue(cells, 'UniqueId');

  // Drawing number
  const drawingNumberMetadata = getKeyValue(
    cells,
    termsMapData['Drawing Number'],
  );

  // Revision number
  const revisionNumber = getKeyValue(cells, termsMapData['Revision Number']);

  // Drawing number
  const businessMetadata = getKeyValue(cells, termsMapData['Business']);

  // building
  const buildingMetadata = getKeyValue(cells, termsMapData['Building']);

  // building
  const villaMetadata = getKeyValue(cells, termsMapData['Villa']);

  // document type
  const docTypeMetadata = getKeyValue(cells, termsMapData['Document Type']);

  // resort
  const resortMetadata = getKeyValue(cells, termsMapData['Resort']);

  // department
  const departmentMetadata = getKeyValue(cells, termsMapData['Department']);

  // discipline
  const disciplineMetadata = getKeyValue(cells, termsMapData['Discipline']);

  // drawingArea
  const drawingAreaMetadata = getKeyValue(cells, termsMapData['Drawing Area']);

  // drawingDate
  const drawingDateMetadata = getKeyValue(cells, termsMapData['Drawing Date']);

  // drawingReceivedDate
  const drawingReceivedDateMetadata = getKeyValue(
    cells,
    termsMapData['Drawing Received Date'],
  );

  return {
    titleMetadata,
    authorMetadata,
    shortDescMetadata,
    drawingNumberMetadata,
    siteNameUrl,
    path,
    documentType,
    UniqueId,
    buildingMetadata,
    businessMetadata,
    resortMetadata,
    departmentMetadata,
    villaMetadata,
    docTypeMetadata,
    disciplineMetadata,
    revisionNumber,
    drawingAreaMetadata,
    drawingDateMetadata,
    drawingReceivedDateMetadata,
  };
};

export default getViewDataFromCells;
