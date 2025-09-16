import { z } from 'zod';
import dayjs from 'dayjs';
import { TERMS_KEY_MAPPING_CT } from '../../const/common';

const singleFileSchema = z.instanceof(File);
const today = dayjs();
const minDrawingDate = dayjs('2016-01-01');

const dayjsSchema = z
  .any()
  .refine((val) => dayjs.isDayjs(val) && val.isValid(), {
    message: 'Invalid date',
  });

const drawingDateSchema = dayjsSchema
  .refine((val) => val.isAfter(minDrawingDate.subtract(1, 'day')), {
    message: 'Drawing Date cannot be before Jan 1, 2016',
  })
  .refine((val) => val.isBefore(today.add(1, 'day')), {
    message: 'Drawing Date cannot be in the future',
  });

const receivedDateSchema = dayjsSchema.refine(
  (val) => val.isBefore(today.add(1, 'day')),
  {
    message: 'Received Date cannot be in the future',
  },
);

export const uploadSchema = z
  .object({
    file: singleFileSchema,
    Title: z
      .string({ required_error: 'Title is Required' })
      .min(1, 'Title is required'),
    [TERMS_KEY_MAPPING_CT.SHORT_DESCRIPTION]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.BUSINESS]: z
      .string({ required_error: 'Business is Required' })
      .min(1, 'Business is required'),
    [TERMS_KEY_MAPPING_CT.DEPARTMENT]: z
      .string({ required_error: 'Department is Required' })
      .min(1, 'Department is required'),
    [TERMS_KEY_MAPPING_CT.RESORT]: z
      .string({ required_error: 'Resort is Required' })
      .min(1, 'Resort is required'),
    [TERMS_KEY_MAPPING_CT.PARK_STAGE]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.BUILDING]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.VILLA]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE]: z
      .string({ required_error: 'Document Type is Required' })
      .min(1, 'Document Type is required'),
    [TERMS_KEY_MAPPING_CT.DISCIPLINE]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.GATE]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.DRAWING_NUMBER]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.REVISION_NUMBER]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.DRAWING_AREA]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.CONFIDENTIALITY]: z.string().nullish(),
    [TERMS_KEY_MAPPING_CT.DRAWING_DATE]: drawingDateSchema.nullish(),
    [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE]: receivedDateSchema.nullish(),
  })
  .superRefine((doc, ctx) => {
    const isDrawing =
      doc[TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE]?.includes('Drawing');

    const requiredIfDrawing = [
      {
        key: TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME,
        label: 'Drawing Set Name',
      },
      { key: TERMS_KEY_MAPPING_CT.DRAWING_NUMBER, label: 'Drawing Number' },
      {
        key: TERMS_KEY_MAPPING_CT.REVISION_NUMBER,
        label: 'Revision Number',
      },
      { key: TERMS_KEY_MAPPING_CT.DRAWING_AREA, label: 'Drawing Area' },
      { key: TERMS_KEY_MAPPING_CT.DRAWING_DATE, label: 'Drawing Date' },
      {
        key: TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
        label: 'Drawing Received Date',
      },
    ];

    if (isDrawing) {
      requiredIfDrawing.forEach(({ key, label }) => {
        if (!doc[key]) {
          ctx.addIssue({
            path: [key],
            code: z.ZodIssueCode.custom,
            message: `${label} is required when Document Type is 'Drawing'`,
          });
        }
      });
    }

    const drawingDate = doc[TERMS_KEY_MAPPING_CT.DRAWING_DATE];
    const receivedDate = doc[TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE];

    // Compare the two dates if both are present
    if (drawingDate && receivedDate) {
      if (drawingDate.isAfter(receivedDate)) {
        ctx.addIssue({
          path: [TERMS_KEY_MAPPING_CT.DRAWING_DATE],
          code: z.ZodIssueCode.custom,
          message: 'Drawing Date cannot be after Received Date',
        });
        ctx.addIssue({
          path: [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE],
          code: z.ZodIssueCode.custom,
          message: 'Received Date cannot be before Drawing Date',
        });
      }
    }
  });

export const filesSchema = z.object({
  documents: z.array({
    file: singleFileSchema,
  }),
});
