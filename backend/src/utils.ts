import { z } from "zod";
import { Request, Response } from "express";

export const makeQueryEndpoint =
    <TQuery>(
        schema: z.Schema<TQuery>,
        handler: (
            req: Request<any, any, any, TQuery>,
            res: Response,
            data: TQuery
        ) => void
    ) =>
    (req: Request<any, any, any, TQuery>, res: Response) => {
        const parsedQuery = schema.safeParse(req.query);

        if (!parsedQuery.success) {
            return res.status(422).json({
                status: "error",
                message: parsedQuery.error.issues[0].message,
            });
        }

        return handler(req, res, parsedQuery.data);
    };

export const makeParamsEndpoint =
    <TParams>(
        schema: z.Schema<TParams>,
        handler: (req: Request<TParams>, res: Response, data: TParams) => void
    ) =>
    (req: Request<TParams>, res: Response) => {
        const parsedParams = schema.safeParse(req.params);

        if (!parsedParams.success) {
            return res.status(422).json({
                status: "error",
                message: parsedParams.error.issues[0].message,
            });
        }

        return handler(req, res, parsedParams.data);
    };

export const makeBodyEndpoint =
    <TBody>(
        schema: z.Schema<TBody>,
        handler: (
            req: Request<any, any, TBody>,
            res: Response,
            data: TBody
        ) => void
    ) =>
    (req: Request<any, any, TBody>, res: Response) => {
        const parsedBody = schema.safeParse(req.body);

        if (!parsedBody.success) {
            return res.status(422).json({
                status: "error",
                message: parsedBody.error.issues[0].message,
            });
        }

        return handler(req, res, parsedBody.data);
    };
