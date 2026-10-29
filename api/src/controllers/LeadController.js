import { listLeads, getLead, getLeadFilterOptions, updateLead } from "#src/services";
import { leadQuerySchema, leadUpdateSchema } from "#src/schemas";

const LeadController = () => {
  async function findAll(req, res, next) {
    try {
      const { page, pageSize, orderBy, ...filters } = leadQuerySchema.parse(req.query);
      const data = await listLeads(req.user.id, filters, { page, pageSize, orderBy });

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function filterOptions(req, res, next) {
    try {
      const data = await getLeadFilterOptions(req.user.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function show(req, res, next) {
    try {
      const data = await getLead(req.user.id, req.params.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function update(req, res, next) {
    try {
      const data = await updateLead(req.user.id, req.params.id, leadUpdateSchema.parse(req.body ?? {}));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    findAll,
    filterOptions,
    show,
    update,
  };
};

export { LeadController };
export default LeadController;
