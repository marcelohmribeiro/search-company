import { listLeads, getLeadFilterOptions, updateLead, exportLeadsCsv } from "#src/services";
import { leadQuerySchema, leadUpdateSchema } from "#src/schemas";

const LeadController = () => {
  async function findAll(req, res, next) {
    try {
      const { page, pageSize, orderBy, ...filters } = leadQuerySchema.parse(req.query);
      const data = await listLeads(filters, { page, pageSize, orderBy });

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function filterOptions(req, res, next) {
    try {
      const data = await getLeadFilterOptions();

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function update(req, res, next) {
    try {
      const data = await updateLead(req.params.id, leadUpdateSchema.parse(req.body ?? {}));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function exportCsv(req, res, next) {
    try {
      const { page, pageSize, orderBy, ...filters } = leadQuerySchema.parse(req.query);
      const csv = await exportLeadsCsv(filters, { orderBy });
      const date = new Date().toISOString().slice(0, 10);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="leads-${date}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  return {
    findAll,
    filterOptions,
    update,
    exportCsv,
  };
};

export { LeadController };
export default LeadController;
