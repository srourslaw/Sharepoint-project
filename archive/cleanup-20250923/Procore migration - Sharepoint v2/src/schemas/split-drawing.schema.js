import { z } from 'zod';
import { TERMS_KEY_MAPPING_CT } from '../const/common';
import dayjs from 'dayjs';

const today = dayjs();
const minDrawingDate = dayjs('2016-01-01');

export const pageEntrySchema = z
  .object({
    Title: z.any(),
    [TERMS_KEY_MAPPING_CT.DRAWING_NUMBER]: z.any(),
    [TERMS_KEY_MAPPING_CT.REVISION_NUMBER]: z.any(),
    [TERMS_KEY_MAPPING_CT.DRAWING_DATE]: z.any(),
    [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE]: z.any(),
    file: z.any(),
  })
  .superRefine((data, ctx) => {
    if (typeof data.Title !== 'string' || data.Title.trim().length < 1) {
      ctx.addIssue({
        path: ['Title'],
        code: z.ZodIssueCode.custom,
        message: 'Title is required',
      });
    }

    if (
      typeof data[TERMS_KEY_MAPPING_CT.DRAWING_NUMBER] !== 'string' ||
      data[TERMS_KEY_MAPPING_CT.DRAWING_NUMBER].trim().length < 1
    ) {
      ctx.addIssue({
        path: [TERMS_KEY_MAPPING_CT.DRAWING_NUMBER],
        code: z.ZodIssueCode.custom,
        message: 'Drawing Number is required',
      });
    }

    if (
      typeof data[TERMS_KEY_MAPPING_CT.REVISION_NUMBER] !== 'string' ||
      data[TERMS_KEY_MAPPING_CT.REVISION_NUMBER].trim().length < 1
    ) {
      ctx.addIssue({
        path: [TERMS_KEY_MAPPING_CT.REVISION_NUMBER],
        code: z.ZodIssueCode.custom,
        message: 'Revision Number is required',
      });
    }

    const drawingDate = data[TERMS_KEY_MAPPING_CT.DRAWING_DATE];
    if (!dayjs.isDayjs(drawingDate) || !drawingDate.isValid()) {
      ctx.addIssue({
        path: [TERMS_KEY_MAPPING_CT.DRAWING_DATE],
        code: z.ZodIssueCode.custom,
        message: 'Invalid Drawing Date',
      });
    } else {
      if (!drawingDate.isAfter(minDrawingDate.subtract(1, 'day'))) {
        ctx.addIssue({
          path: [TERMS_KEY_MAPPING_CT.DRAWING_DATE],
          code: z.ZodIssueCode.custom,
          message: 'Drawing Date cannot be before Jan 1, 2016',
        });
      }
      if (!drawingDate.isBefore(today.add(1, 'day'))) {
        ctx.addIssue({
          path: [TERMS_KEY_MAPPING_CT.DRAWING_DATE],
          code: z.ZodIssueCode.custom,
          message: 'Drawing Date cannot be in the future',
        });
      }
    }

    const receivedDate = data[TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE];
    if (!dayjs.isDayjs(receivedDate) || !receivedDate.isValid()) {
      ctx.addIssue({
        path: [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE],
        code: z.ZodIssueCode.custom,
        message: 'Invalid Drawing Received Date',
      });
    } else {
      if (!receivedDate.isAfter(minDrawingDate.subtract(1, 'day'))) {
        ctx.addIssue({
          path: [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE],
          code: z.ZodIssueCode.custom,
          message: 'Drawing Received Date cannot be before Jan 1, 2016',
        });
      }
      if (!receivedDate.isBefore(today.add(1, 'day'))) {
        ctx.addIssue({
          path: [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE],
          code: z.ZodIssueCode.custom,
          message: 'Received Date cannot be in the future',
        });
      }
    }

    if (
      dayjs.isDayjs(drawingDate) &&
      drawingDate.isValid() &&
      dayjs.isDayjs(receivedDate) &&
      receivedDate.isValid()
    ) {
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

    if (!(data.file instanceof File)) {
      ctx.addIssue({
        path: ['file'],
        code: z.ZodIssueCode.custom,
        message: 'A file is required',
      });
    }
  });

export const uploadSplitDrawingSchema = z.object({
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
  [TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME]: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.trim() !== '', {
      message: 'Drawing Set Name is Required',
    }),
  [TERMS_KEY_MAPPING_CT.DRAWING_AREA]: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.trim() !== '', {
      message: 'Drawing Area is Required',
    }),
  [TERMS_KEY_MAPPING_CT.CONFIDENTIALITY]: z.string().nullish(),
  pages: z.record(z.string(), pageEntrySchema),
});

const valueItem = z.object({
  pos: z.number(),
  text: z.string(),
});

const baseObject = z.object({
  values: z.array(valueItem),
  img: z.string(),
  status: z.string(),
  search_keys: z.array(z.string()),
  coordinates: z.array(z.number()),
});

export const getSplitDocumentDetailsSchema = z.object({
  TITLE: z.array(baseObject).optional(),
  'DRAWING NUMBER': z.array(baseObject).optional(),
  REVISION: z.array(baseObject).optional(),
  DATE: z.array(baseObject).optional(),
  ARCHITECT: z.array(baseObject).optional(),
  'CHECKED BY': z.array(baseObject).optional(),
  PROJECT: z.array(baseObject).optional(),
  image: z.string().optional(),
});

const pageSchema = z.object({
  page: z.number(),
  pdf: z.string().optional(),
  img: z.string().optional(),
  status: z.string(),
  details: getSplitDocumentDetailsSchema.optional(),
  document_uri: z.string().optional(),
});

export const splitDrawingStatusSchema = z.object({
  page_count: z.number(),
  pages: z.record(z.string().regex(/^page_\d+$/), pageSchema),
});
